import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import { users } from "./db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log("--- START PŘIHLÁŠENÍ ---");
        console.log("1. Zkouším email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("CHYBA: Chybí email nebo heslo");
          return null;
        }

        try {
          console.log("2. Spouštím stabilní databázový dotaz...");

          const result = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          const user = result[0];

          console.log("3. Nalezený uživatel v DB:", user ? "ANO" : "NE");

          if (!user || !user.email) {
            console.log("CHYBA: Uživatel nenalezen nebo nemá v DB email.");
            return null;
          }

          if (!user) {
            console.log("CHYBA: Uživatel v databázi neexistuje.");
            return null;
          }

          if (!user.password) {
            console.log("CHYBA: Uživatel existuje, ale nemá heslo (GitHub účet).");
            return null;
          }

          const passwordsMatch = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          console.log("4. Shoduje se heslo zadané s hashem v DB?", passwordsMatch);

          if (!passwordsMatch) {
            console.log("CHYBA: Špatné heslo.");
            return null;
          }

          console.log("5. Vše OK, uživatel ověřen!");
          console.log("--- KONEC PŘIHLÁŠENÍ ---");
          
          return user;

        } catch (error) {
          console.error("!!! KRITICKÁ CHYBA PŘI PŘIHLÁŠENÍ !!!", error);
          return null;
        }
      },
    }),
  ],
callbacks: {
  async signIn({ user, account }) {
    if (account?.provider !== "credentials") {
      if (!user.email) {
        user.email = `github_${account?.providerAccountId}@noemail.local`;
      }

      await db
        .insert(users)
        .values({
          id: user.id!,
          name: user.name,
          email: user.email,
          image: user.image,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            name: user.name,
            image: user.image,
          },
        });

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, user.email))
        .limit(1);

      if (existing[0]) {
        user.id = existing[0].id; 
      }
    }
    return true;
  },
  async jwt({ token, user }) {
    if (user) token.id = user.id;
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.id) session.user.id = token.id as string;
    return session;
  },
},
})