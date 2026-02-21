import { registerUser } from "@/lib/actions";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Registrace
        </h1>
        
        <form action={registerUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Jméno</label>
            <input 
            name="name"
            type="text" 
            required 
            className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none text-blue-900 bg-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
            <input 
              name="email" 
              type="email" 
              required 
              className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Heslo</label>
            <input 
              name="password" 
              type="password" 
              required 
              className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Heslo znovu</label>
            <input 
              name="repeatPassword" 
              type="password" 
              required 
              className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-4 rounded-lg transition-colors mt-6"
          >
            Vytvořit účet
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-blue-800">
          Už máte účet? <Link href="/login" className="font-bold underline text-blue-600 hover:text-yellow-500">Přihlaste se</Link>
        </p>
      </div>
    </div>
  );
}