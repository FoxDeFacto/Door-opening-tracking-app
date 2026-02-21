"use server";

import { db } from "@/db";
import { users, doorInstances, auditLogs } from "@/db/schema";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

// 1. Registrace uživatele
export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const repeatPassword = formData.get("repeatPassword") as string;

  if (!email || !password || !name) {
    throw new Error("Vyplňte všechna pole.");
  }

  if (password !== repeatPassword) {
    throw new Error("Hesla se neshodují.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Vložení uživatele do databáze
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });

  // Po úspěšné registraci přesměrujeme na přihlášení
  redirect("/login");
}

// 2. Vytvoření instance dveří
export async function createDoorInstance(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nejste přihlášeni.");

  const name = formData.get("name") as string;
  
  await db.insert(doorInstances).values({
    userId: session.user.id,
    name,
  });

  redirect("/dashboard");
}

// 3. Smazání instance dveří
export async function deleteDoorInstance(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nejste přihlášeni.");

  await db.delete(doorInstances).where(eq(doorInstances.id, id));

  redirect("/dashboard");
}

// 4. Zapsání akce do auditu (kliknutí na +/- u dveří)
export async function logStateAction(instanceId: string, stateType: number, action: "increment" | "decrement") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nejste přihlášeni.");

  await db.insert(auditLogs).values({
    instanceId,
    stateType,
    action,
  });
}