"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
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

          <RegisterForm />

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
