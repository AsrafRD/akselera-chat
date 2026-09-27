"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registrasi gagal");
      }

      router.push("/chat");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registrasi gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-black dark:text-white transition-colors">
      <header className="h-16 flex items-center justify-between px-6 shrink-0">
        <Link href="/" className="flex items-center">
          <img src="/logo-black.png" alt="Akselera.Tech" className="h-6 dark:hidden block" />
          <img src="/logo-white.png" alt="Akselera.Tech" className="h-6 hidden dark:block" />
        </Link>
        <ThemeSwitcher />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Daftar Akun</h1>

          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Andi Pratama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 rounded-lg outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
              <input
                type="email"
                placeholder="andi@contoh.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 rounded-lg outline-none transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 rounded-lg outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? "Memproses..." : "Daftar"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-black dark:text-white font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
