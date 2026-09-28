"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Login gagal");
      }

      router.push("/chat");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Email atau password salah");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      {error && (
        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="andi@contoh.id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-500 rounded-lg outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:border-zinc-500 dark:focus:border-zinc-500 rounded-lg outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
