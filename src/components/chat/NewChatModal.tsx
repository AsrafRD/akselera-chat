"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function NewChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Gagal mencari user");
      const { data } = await res.json();
      return data as { id: string; name: string; email: string }[];
    },
    enabled: searchQuery.length > 0,
  });

  const createChatMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) throw new Error("Gagal membuat percakapan");
      const { data } = await res.json();
      return data as { conversationId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onClose();
      // Optional: Arahkan langsung ke chat yang baru dibuat
      // router.push(`/chat?id=${data.conversationId}`);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-lg">Chat baru</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-sm outline-none transition-colors"
            />
          </div>
        </div>

        {/* List Hasil Pencarian */}
        <div className="flex-1 overflow-y-auto p-2">
          {searchQuery.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Ketik nama atau email untuk mencari pengguna lain.
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Mencari...
            </div>
          ) : users && users.length > 0 ? (
            <div className="flex flex-col gap-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => createChatMutation.mutate(user.id)}
                  disabled={createChatMutation.isPending}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm">
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{user.name}</div>
                      <div className="text-xs text-zinc-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-zinc-400">
                    Mulai chat
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-500 text-sm">
              Pengguna tidak ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
