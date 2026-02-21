"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Neplatné přihlašovací údaje.");
    } else if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-600 p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Přihlášení
        </h1>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">Heslo</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3 px-4 rounded-lg transition-colors mt-6"
          >
            Přihlásit se
          </button>
        </form>

        <div className="mt-6 border-t border-blue-100 pt-6">
          <button 
            type="button" // Zabrání tomu, aby se tlačítko chovalo jako odeslání formuláře
            onClick={() => signIn("github", { redirectTo: "/dashboard" })}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Přihlásit přes GitHub
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-blue-800">
          Nemáte účet? <Link href="/register" className="font-bold underline text-blue-600 hover:text-yellow-500">Zaregistrujte se</Link>
        </p>
      </div>
    </div>
  );
}