import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs, doorInstances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, DoorClosed, DoorOpen } from "lucide-react";

const DOOR_STATES = {
  1: { label: "Zavřený -> Zavřený", icon: DoorClosed },
  2: { label: "Zavřený -> Otevřený", icon: DoorOpen },
  3: { label: "Otevřený -> Zavřený", icon: DoorClosed },
  4: { label: "Otevřený -> Otevřený", icon: DoorOpen },
};

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await params;
  const instanceId = resolvedParams.id;

  // 1. Získání informací o instanci
  const instance = await db.query.doorInstances.findFirst({
    where: eq(doorInstances.id, instanceId),
  });

  if (!instance || instance.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // 2. Získání všech audit logů pro tuto instanci
  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.instanceId, instanceId),
    orderBy: [desc(auditLogs.createdAt)],
  });

  // 3. Výpočet aktuálních stavů (sečtení incrementů a odečtení decrementů)
  const stats = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  logs.forEach((log) => {
    const key = log.stateType as keyof typeof stats;
    if (log.action === "increment") {
      stats[key] += 1;
    } else if (log.action === "decrement") {
      stats[key] = Math.max(0, stats[key] - 1); // Zabráníme záporným číslům
    }
  });

  // Nalezení maximální hodnoty pro správné škálování sloupcového grafu
  const maxCount = Math.max(...Object.values(stats), 1); // Minimum 1, aby nedošlo k dělení nulou

  return (
    <div className="min-h-screen bg-blue-600 p-4 md:p-8 text-blue-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigace a hlavička */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
          <Link 
            href={`/dashboard/${instanceId}`} 
            className="flex items-center gap-2 hover:text-yellow-400 transition-colors bg-blue-700/50 px-4 py-2 rounded-lg"
          >
            <ArrowLeft size={20} /> Zpět na počítání
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-white">Statistiky: {instance.name}</h1>
            <p className="text-blue-200">Celkový počet zaznamenaných akcí: {logs.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sloupcový graf (Tailwind) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-2">
              <Activity size={24} className="text-yellow-500" />
              Aktuální frekvence stavů
            </h2>
            
            <div className="space-y-6">
              {[1, 2, 3, 4].map((stateId) => {
                const count = stats[stateId as keyof typeof stats];
                const percentage = (count / maxCount) * 100;
                const StateIcon = DOOR_STATES[stateId as keyof typeof DOOR_STATES].icon;

                return (
                  <div key={stateId} className="relative">
                    <div className="flex justify-between text-sm font-bold text-blue-800 mb-1">
                      <span className="flex items-center gap-2">
                        <StateIcon size={16} /> 
                        {DOOR_STATES[stateId as keyof typeof DOOR_STATES].label}
                      </span>
                      <span>{count}x</span>
                    </div>
                    {/* Pozadí sloupce (světle modré) */}
                    <div className="w-full h-8 bg-blue-100 rounded-full overflow-hidden">
                      {/* Vyplněný sloupec (žlutý) */}
                      <div 
                        className="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historie logů (Audit) */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col h-full max-h-[500px]">
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b border-blue-100 pb-2">
              Poslední aktivita
            </h2>
            
            <div className="overflow-y-auto flex-grow pr-2 space-y-3 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-blue-400 text-center py-4">Zatím žádné záznamy.</p>
              ) : (
                logs.slice(0, 50).map((log) => ( // Zobrazíme jen posledních 50 kvůli výkonu
                  <div key={log.id} className="flex items-center justify-between text-sm p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div>
                      <span className="font-semibold text-blue-900 block">
                        {DOOR_STATES[log.stateType as keyof typeof DOOR_STATES].label}
                      </span>
                      <span className="text-xs text-blue-500">
                        {log.createdAt.toLocaleString("cs-CZ")}
                      </span>
                    </div>
                    <span className={`font-bold px-2 py-1 rounded-md ${
                      log.action === "increment" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>
                      {log.action === "increment" ? "+1" : "-1"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}