'use client'
import { useState } from "react";
import { signOut } from "next-auth/react";
import { createDoorInstance, deleteDoorInstance } from "@/lib/actions";
import Link from "next/link";
import { Trash2, DoorOpen, ArrowBigRight, ArrowBigLeft,RotateCcw } from "lucide-react";
import { Session } from "next-auth";
import { DoorInstance, PaginationDirection } from "@/lib";
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type DashboardClientProps = {
  instances : DoorInstance[],
  session : Session,
  page: string,
  totalPages: number,
  filter:string
};


export default function DashboardClient({instances, session, page,totalPages, filter}:DashboardClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
 
  const handlePagination = (page: string,direction: PaginationDirection) => {
    const params = new URLSearchParams(searchParams.toString());
    page=(Number(page)+direction) > 0 ? (Number(page)+direction).toString() : "1" ;
    params.set("page",page);
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (formData: FormData) => {
    const searchTerm = formData.get("filter") as string;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");

    if (searchTerm) {
      params.set("filter", searchTerm);
    } else {
      params.delete("filter");
    }
    
    router.push(`${pathname}?${params.toString()}`);
  }

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.delete("filter");
    router.push(`${pathname}?${params.toString()}`);
  }


  return (
    <div className="min-h-screen bg-blue-600 p-8 text-blue-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hlavička a ovládací prvky */}
        <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Přehled počítání dveří</h1>
                <div className="flex items-center gap-4">
                    <p className="text-blue-600 font-medium">Vítejte, {session?.user?.name}</p>
                    
                    <button 
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded-md transition-colors font-bold"
                    >
                        Odhlásit se
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-auto">
                
                <div className="flex gap-2 w-full">
                    <form action={handleSearch} className="flex gap-2 grow">
                        <input 
                            name="filter" 
                            type="text" 
                            defaultValue={filter}
                            placeholder="Hledat instanci..." 
                            className="border border-blue-200 rounded-lg p-2 grow focus:ring-2 focus:ring-yellow-400 focus:outline-none text-blue-900 bg-white"
                        />
                        <button 
                            type="submit" 
                            className="bg-blue-100 hover:bg-blue-200 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap text-blue-900"
                        >
                            Vyhledat
                        </button>
                    </form>
                    
                    <button
                        onClick={handleReset} 
                        type="button"
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center"
                        title="Resetovat filtry"
                    >
                        <RotateCcw size={18}/>
                    </button>
                </div>
                
                {!showCreate ? (
                    <button 
                        onClick={() => setShowCreate(true)}
                        className="bg-yellow-400 hover:bg-yellow-500 font-bold py-2 px-4 rounded-lg transition-colors w-full text-blue-900 flex justify-center items-center gap-2"
                    >
                        <span>+ Nová instance</span>
                    </button>
                ) : (
                    <form action={createDoorInstance} className="flex gap-2 w-full animate-in fade-in slide-in-from-top-2">
                        <input 
                            name="name" 
                            type="text" 
                            placeholder="Zadejte název..." 
                            required 
                            autoFocus
                            className="border border-yellow-400 rounded-lg p-2 grow focus:ring-2 focus:ring-yellow-500 focus:outline-none text-blue-900 bg-white"
                        />
                        <button 
                            type="submit" 
                            className="bg-yellow-400 hover:bg-yellow-500 font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap text-blue-900"
                        >
                            Vytvořit
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setShowCreate(false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-2 px-3 rounded-lg transition-colors"
                            title="Zrušit"
                        >
                            X
                        </button>
                    </form>
                )}
            </div>
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
        <div className="mx-auto flex justify-center gap-2">
            <button 
                onClick={()=>handlePagination(page,PaginationDirection.DOWN)}
                className="flex bg-white px-2 py-1 rounded-2xl"
            >
                <ArrowBigLeft size={15}/></button>
            {(totalPages >= (Number(page)+1)) &&    
            <button 
                onClick={()=>handlePagination(page,PaginationDirection.UP)}
                className="flex bg-white px-2 py-1 rounded-2xl"
            >
                <ArrowBigRight size={15}/>
            </button>
            }
        </div>
      </div>
    </div>
  );
}