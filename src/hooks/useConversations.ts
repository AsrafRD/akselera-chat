import { useQuery } from "@tanstack/react-query";

export interface Conversation {
  id: string;
  participant: { id: string; name: string; email: string } | null;
  lastMessage: { body: string; createdAt: string } | null;
  updatedAt: string;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Gagal mengambil percakapan");
      const { data } = await res.json();
      return data;
    },
    // Karena ini aplikasi chat, data percakapan perlu lumayan segar, namun
    // staleTime default di providers.tsx (5 detik) sudah cukup oke.
    refetchInterval: 3000, // Refresh otomatis tiap 3 detik (Realtime Polling)
  });
}
