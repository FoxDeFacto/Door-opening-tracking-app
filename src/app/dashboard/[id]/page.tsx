import { db } from "@/db"; // Upravte cestu podle vašeho projektu
import { auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import CounterClient from "./CounterClient";

export default async function InstancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const instanceId = resolvedParams.id;

  // Stáhneme celou historii klikání pro tuto konkrétní instanci
  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.instanceId, instanceId),
  });

  // Vypočítáme aktuální stav každého počítadla stejným způsobem jako na stránce statistik
  const initialCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  logs.forEach((log) => {
    const key = log.stateType as keyof typeof initialCounts;
    if (log.action === "increment") {
      initialCounts[key] += 1;
    } else if (log.action === "decrement") {
      initialCounts[key] = Math.max(0, initialCounts[key] - 1);
    }
  });

  // Pošleme vypočítaná data do Klientské komponenty, která se postará o interaktivitu
  return <CounterClient instanceId={instanceId} initialCounts={initialCounts} />;
}