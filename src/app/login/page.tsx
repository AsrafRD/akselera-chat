"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-black dark:text-white transition-colors">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center">
          <img src="/logo-black.png" alt="Akselera.Tech" className="h-24 dark:hidden block" />
          <img src="/logo-white.png" alt="Akselera.Tech" className="h-24 hidden dark:block" />
        </div>
        <ThemeSwitcher />
      </header>

      {/* Main Login Card (Center Screen) */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">Masuk</h1>

          <LoginForm />
          
          <div className="mt-6 text-center text-sm text-zinc-500">
            Belum punya akun? <Link href="/register" className="text-black dark:text-white font-medium hover:underline">Daftar di sini</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
