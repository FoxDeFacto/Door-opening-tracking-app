"use client";

import { useState, useTransition } from "react";
import { logStateAction } from "@/lib/actions"; // Ujistěte se, že cesta je správná podle vašeho projektu
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, BarChart2 } from "lucide-react";
import { DOOR_STATES } from "@/lib";

interface CounterClientProps {
  instanceId: string;
  initialCounts: {
    1: number;
    2: number;
    3: number;
    4: number;
  };
}

export default function CounterClient({ instanceId, initialCounts }: CounterClientProps) {
  const [isPending, startTransition] = useTransition();
  const [counts, setCounts] = useState(initialCounts); //Nastaví výchozí stav podle informací z historie
  const [visualDoorState, setVisualDoorState] = useState(false); 

  const handleAction = (stateId: number, action: "increment" | "decrement", doorOpen: boolean) => {
    setVisualDoorState(doorOpen);
    setCounts((prev) => ({
      ...prev,
      [stateId]: action === "increment" ? prev[stateId as keyof typeof prev] + 1 : Math.max(0, prev[stateId as keyof typeof prev] - 1),
    }));

    startTransition(() => {
      // Bezpečností funkce, kdyby někdo fakt klikal
      logStateAction(instanceId, stateId, action);
    });
  };

  return (
    <div className="min-h-screen bg-blue-600 p-4 md:p-8 flex flex-col items-center">
      
      {/* Navigace */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 text-white">
        <Link href="/dashboard" className="flex items-center gap-2 hover:text-yellow-400 transition-colors bg-blue-700/50 px-4 py-2 rounded-lg">
          <ArrowLeft size={20} /> Zpět na přehled
        </Link>
        <Link href={`/dashboard/${instanceId}/stats`} className="flex items-center gap-2 hover:text-yellow-400 transition-colors bg-blue-700/50 px-4 py-2 rounded-lg">
          <BarChart2 size={20} /> Statistiky
        </Link>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Vizuál dveří (Animace) */}
        <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center shadow-2xl h-96">
          <h2 className="text-xl font-bold text-blue-900 mb-8">Aktuální stav dveří</h2>
          
          <div className="relative w-40 h-64 bg-gray-200 border-4 border-blue-900 rounded-t-lg perspective-1000">
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-yellow-400 border-2 border-yellow-500 origin-left rounded-t-sm"
              animate={{ rotateY: visualDoorState ? -85 : 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute right-3 top-1/2 w-4 h-2 bg-blue-900 rounded-full" />
            </motion.div>
            
            <div className="absolute inset-0 bg-blue-100 -z-10 rounded-t-sm flex items-center justify-center text-blue-300 font-bold">
              Průchod
            </div>
          </div>
        </div>

        {/* Ovládací panel (4 stavy) */}
        <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col justify-center gap-4">
          <h2 className="text-xl font-bold text-blue-900 text-center mb-2">Záznam stavů</h2>
          
          {DOOR_STATES.map((state) => (
            <div key={state.id} className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="font-semibold text-blue-900 w-1/2">{state.label}</span>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleAction(state.id, "decrement", state.doorOpen)}
                  disabled={counts[state.id as keyof typeof counts] === 0}
                  className="w-10 h-10 rounded-full bg-blue-200 text-blue-900 font-bold text-xl hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  -
                </button>
                
                <span className="text-2xl font-bold text-blue-900 w-8 text-center">
                  {counts[state.id as keyof typeof counts]}
                </span>
                
                <button
                  onClick={() => handleAction(state.id, "increment", state.doorOpen)}
                  className="w-12 h-12 rounded-full bg-yellow-400 text-blue-900 font-bold text-2xl hover:bg-yellow-500 flex items-center justify-center shadow-md transition-transform active:scale-95"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}