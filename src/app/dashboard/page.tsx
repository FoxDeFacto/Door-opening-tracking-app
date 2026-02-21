import { auth, signOut } from "@/auth";
import { db } from "@/db";
import { doorInstances } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createDoorInstance, deleteDoorInstance } from "@/lib/actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2, DoorOpen } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  
  // Ochrana routy: Pokud není uživatel přihlášen, vyhodíme ho na login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Načtení instancí patřících přihlášenému uživateli
  const instances = await db.query.doorInstances.findMany({
    where: eq(doorInstances.userId, session.user.id),
    orderBy: (instances, { desc }) => [desc(instances.createdAt)],
  });

  return (
    <div className="min-h-screen bg-blue-600 p-8 text-blue-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hlavička a formulář pro novou instanci */}
        <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold">Přehled počítání dveří</h1>
            <div className="flex items-center gap-4 mt-2">
            <p className="text-blue-600 font-medium">Vítejte, {session.user.name}</p>
            
            {/* TLAČÍTKO PRO ODHLÁŠENÍ */}
            <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
            }}>
                <button type="submit" className="text-xs bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded-md transition-colors font-bold">
                Odhlásit se
                </button>
            </form>
            </div>
        </div>
        
        <form action={createDoorInstance} className="flex gap-2 w-full md:w-auto mt-4 md:mt-0">
            <input 
            name="name" 
            type="text" 
            placeholder="Název nové instance..." 
            required 
            className="border border-blue-200 rounded-lg p-2 grow focus:ring-2 focus:ring-yellow-400 focus:outline-none text-blue-900 bg-white"
            />
            <button 
            type="submit" 
            className="bg-yellow-400 hover:bg-yellow-500 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap text-blue-900"
            >
            Vytvořit
            </button>
        </form>
        </div>

        {/* Výpis instancí */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instances.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-xl text-center text-blue-600 opacity-80">
              Zatím nemáte žádné instance. Vytvořte svou první výše.
            </div>
          ) : (
            instances.map((instance) => (
              <div key={instance.id} className="bg-white p-5 rounded-xl shadow-lg flex flex-col justify-between">
                <div className="mb-4">
                  <h2 className="text-xl font-bold truncate" title={instance.name}>
                    {instance.name}
                  </h2>
                  <p className="text-xs text-blue-400">
                    Vytvořeno: {instance.createdAt.toLocaleDateString("cs-CZ")}
                  </p>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link 
                    href={`/dashboard/${instance.id}`}
                    className="grow bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold py-2 px-3 rounded-lg text-center transition-colors flex items-center justify-center gap-2"
                  >
                    <DoorOpen size={18} />
                    Počítat
                  </Link>
                  
                  {/* Formulář pro smazání využívající bind pro předání ID */}
                  <form action={deleteDoorInstance.bind(null, instance.id)}>
                    <button 
                      type="submit"
                      className="bg-red-100 hover:bg-red-200 text-red-600 p-2 rounded-lg transition-colors"
                      title="Smazat instanci"
                    >
                      <Trash2 size={20} />
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}