import { db } from "@/db";
import { auditLogs, doorInstances } from "@/db/schema";
import { eq } from "drizzle-orm";
import CounterClient from "./CounterClient";
import { DOOR_STATES, DoorInstance } from "@/lib";
import { notFound } from "next/navigation";

export default async function InstancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const instanceId = resolvedParams.id;

  // Stáhneme celou historii klikání pro tuto konkrétní instanci
  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.instanceId, instanceId),
  });

  const doorInstance: DoorInstance | undefined = await db.query.doorInstances.findFirst({
    where: eq(doorInstances.id, instanceId)
  });

  if (!doorInstance) {
    notFound(); 
  }

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

  const lastState = logs.at(-1)?.stateType;
  const doorState = lastState == DOOR_STATES[2].value || lastState == DOOR_STATES[4].value ;

  // Pošleme vypočítaná data do Klientské komponenty, která se postará o interaktivitu
  return <CounterClient doorInstance={doorInstance} initialCounts={initialCounts} doorState={doorState} />;
}