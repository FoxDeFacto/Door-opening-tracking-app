import { auth } from "@/auth";
import { db } from "@/db";
import { auditLogs, doorInstances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";
import { DOOR_STATES } from "@/lib";

export default async function StatsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resolvedParams = await params;
  const instanceId = resolvedParams.id;

  const instance = await db.query.doorInstances.findFirst({
    where: eq(doorInstances.id, instanceId),
  });

  if (!instance || instance.userId !== session.user.id) {
    redirect("/dashboard");
  }

  // Získání logů (řazeno od nejnovějšího desc)
  const logs = await db.query.auditLogs.findMany({
    where: eq(auditLogs.instanceId, instanceId),
    orderBy: [desc(auditLogs.createdAt)],
    limit: 500
  });

  // --- VÝPOČET ČASOVÉ OSY ---
  // Potřebujeme oddělit výpočet pouze pokud máme logy
  let firstLogTime = 0;
  let lastLogTime = 0;
  let timeRange = 0;
  
  if (logs.length > 0) {
    firstLogTime = logs.at(-1)!.createdAt.getTime(); // Nejstarší bod v čase (Začátek osy, % = 0)
    lastLogTime = logs[0].createdAt.getTime();       // Nejnovější bod v čase (Konec osy, % = 100)
    timeRange = lastLogTime - firstLogTime;
  }

  // Příprava dat pro každý typ stavu
  const timelines: Record<string, { percentage: number, dateStr: string, action: string }[]> = {
    1: [], 2: [], 3: [], 4: []
  };

  if (timeRange > 0) { // Ošetříme dělení nulou, pokud je jen jeden log
    logs.forEach(log => {
      const logTime = log.createdAt.getTime();
      const percentage = ((logTime - firstLogTime) / timeRange) * 100;
      
      const key = String(log.stateType);
      if (timelines[key]) {
        timelines[key].push({
          percentage,
          dateStr: log.createdAt.toLocaleTimeString("cs-CZ", { hour: '2-digit', minute: '2-digit' }),
          action: log.action // pro případné barevné odlišení (increment/decrement)
        });
      }
    });
  }

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
          
          {/* Časové osy (Timelines) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col">
            <h2 className="text-xl font-bold text-blue-900 mb-6 border-b border-blue-100 pb-2 flex items-center gap-2">
              <Activity size={20} /> Rozložení aktivit v čase
            </h2>

            {logs.length < 2 ? (
              <div className="flex-1 flex items-center justify-center text-blue-400">
                Pro zobrazení časové osy jsou potřeba alespoň 2 záznamy.
              </div>
            ) : (
              <div className="space-y-12">
                {/* Popisky začátku a konce pro všechny osy */}
                <div className="flex justify-between text-xs font-bold text-blue-400 px-2">
                  <span>{new Date(firstLogTime).toLocaleString("cs-CZ")}</span>
                  <span>{new Date(lastLogTime).toLocaleString("cs-CZ")}</span>
                </div>

                {/* Vykreslení jednotlivých os */}
                {Object.entries(timelines).map(([stateType, events]) => {
                  const stateConfig = DOOR_STATES[Number(stateType) as keyof typeof DOOR_STATES];
                  if (!stateConfig) return null;

                  return (
                    <div key={stateType} className="relative">
                      {/* Název osy */}
                      <h3 className="text-sm font-semibold text-blue-800 mb-2">
                        {stateConfig.label} ({events.length}x)
                      </h3>
                      
                      {/* Vizuální osa */}
                      <div className="h-4 bg-blue-50 rounded-full w-full relative border border-blue-100">
                        {/* Značky událostí */}
                        {events.map((event, idx) => (
                          <div 
                            key={idx}
                            // Umístění na ose pomocí absolutního pozicování 'left'
                            className={`absolute top-1/2 -translate-y-1/2 w-2 h-4 rounded-sm group cursor-pointer ${
                              event.action === 'increment' ? 'bg-yellow-400 z-10' : 'bg-red-400 z-0'
                            }`}
                            style={{ left: `${event.percentage}%` }}
                          >
                            {/* Tooltip při najetí myší */}
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-blue-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-50">
                              {event.dateStr} ({event.action === 'increment' ? '+1' : '-1'})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historie logů (Audit) */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col h-full max-h-[500px]">
             <h2 className="text-xl font-bold text-blue-900 mb-4 border-b border-blue-100 pb-2">
              Poslední aktivita
            </h2>
            
            <div className="overflow-y-auto grow pr-2 space-y-3 custom-scrollbar">
              {logs.length === 0 ? (
                <p className="text-blue-400 text-center py-4">Zatím žádné záznamy.</p>
              ) : (
                logs.map((log) => (
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