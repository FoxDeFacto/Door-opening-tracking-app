import { auth } from "@/auth";
import { db } from "@/db";
import { doorInstances } from "@/db/schema";
import { eq, count, and, like } from "drizzle-orm";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { DoorInstance } from "@/lib";
import { Session } from "next-auth";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session: Session | null = await auth();
  const params = await searchParams;

  const page = params.page ?? "1";
  const pageNumber = Number(page);
  const filter = (params.filter) ?? ""
  const limit = 9;
  const offset = (pageNumber-1)*limit;
  
  // Ochrana routy: Pokud není uživatel přihlášen, vyhodíme ho na login
  if (!session?.user?.id) {
    redirect("/login");
  }

const [total] = await db
  .select({ value: count() })
  .from(doorInstances)
  .where(
    and(
      eq(doorInstances.userId, session.user.id),
      like(doorInstances.name, `%${filter}%`)
    )
  );

  const totalPages = Math.ceil(total.value/limit);

  const instances: DoorInstance[] = await db.query.doorInstances.findMany({
    where: and(
      eq(doorInstances.userId, session.user.id),
      like(doorInstances.name, `%${filter}%`)
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    limit: limit,
    offset: offset
  });


  return (
   <DashboardClient
    instances={instances}
    session={session}
    page={page}
    totalPages={totalPages}
    filter={filter}
   />
  );
}