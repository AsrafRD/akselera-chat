import Link from "next/link";
import { MessageSquare, Shield, Zap } from "lucide-react";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black text-black dark:text-white transition-colors">
      <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center">
          <img src="/logo-black.png" alt="Akselera.Tech" className="h-6 dark:hidden block" />
          <img src="/logo-white.png" alt="Akselera.Tech" className="h-6 hidden dark:block" />
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          <Link 
            href="/login" 
            className="text-sm font-semibold hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            Masuk
          </Link>
          <Link 
            href="/login" 
            className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Mulai Chat
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium mb-8">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          Internal Beta v0.1
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Komunikasi Tim yang Cepat, <br className="hidden sm:block" />
          Aman, dan Terisolasi.
        </h1>
        
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mb-10">
          Akselera.Tech Chat adalah platform komunikasi internal 1-on-1 dengan 
          keamanan otorisasi 2-lapis. Dibangun untuk memastikan privasi tim Anda tetap terjaga.
        </p>

        <Link 
          href="/login" 
          className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-6 py-3 rounded-full text-lg font-semibold hover:scale-105 active:scale-95 transition-all"
        >
          Masuk ke Aplikasi
          <span>→</span>
        </Link>

        <div className="grid sm:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
              <Zap size={20} />
            </div>
            <h3 className="font-bold">Real-time & Cepat</h3>
            <p className="text-sm text-zinc-500">Optimistic UI dengan TanStack Query untuk pengalaman chat instan tanpa lag.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
              <Shield size={20} />
            </div>
            <h3 className="font-bold">Otorisasi Ketat</h3>
            <p className="text-sm text-zinc-500">Pemisahan otentikasi JWT dan pengecekan akses database 1-on-1 di level API.</p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-10 w-10 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <h3 className="font-bold">Desain Minimalis</h3>
            <p className="text-sm text-zinc-500">Antarmuka bersih dan responsif menggunakan Tailwind CSS murni.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
