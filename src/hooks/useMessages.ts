import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

// 1. Hook untuk mengambil riwayat pesan dari suatu conversationId
export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!res.ok) throw new Error("Gagal mengambil daftar pesan");
      const { data } = await res.json();
      return data;
    },
    enabled: !!conversationId,
    refetchInterval: 3000, // Refresh pesan tiap 3 detik (Realtime Polling)
  });
}

// 2. Hook untuk mengirim pesan dengan Optimistic UI Update
export function useSendMessage(conversationId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!conversationId) throw new Error("Percakapan belum dipilih");
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pesan");
      const { data } = await res.json();
      return data;
    },
    // Saat fungsi mutate dipanggil, sebelum request selesai:
    onMutate: async (newText) => {
      if (!conversationId) return;

      // 1. Batalkan semua refetch yang sedang berjalan untuk list pesan ini
      await queryClient.cancelQueries({ queryKey: ["messages", conversationId] });

      // 2. Simpan cache lama (untuk rollback jika request gagal)
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationId]);

      // 3. Buat obyek pesan 'pura-pura' (Optimistic Message)
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`, 
        conversationId,
        senderId: "optimistic-current-user", // Identifier khusus agar UI tau ini pesan kita
        body: newText,
        createdAt: new Date().toISOString(),
      };

      // 4. Update state secara optimis
      queryClient.setQueryData<Message[]>(["messages", conversationId], (old) => {
        return old ? [...old, optimisticMessage] : [optimisticMessage];
      });

      // Kembalikan konteks yang menyimpan data lama untuk error rollback
      return { previousMessages };
    },
    // Jika request gagal, kembalikan state ke data sebelum pesan dikirim
    onError: (err, newText, context) => {
      if (context?.previousMessages && conversationId) {
        queryClient.setQueryData(["messages", conversationId], context.previousMessages);
      }
    },
    // Apapun yang terjadi (sukses/gagal), force refetch data dari server agar sinkron
    onSettled: () => {
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
        // Kita juga perlu refresh List Chat (agar Last Message dan urutan terupdate)
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });
}
