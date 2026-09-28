"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Koneksi ke Server-Sent Events Endpoint
    const evtSource = new EventSource("/api/stream");

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          // Trigger Tanstack Query untuk refetch
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
        } else if (data.type === "messages_read") {
          // Hanya update messages dan conversations milik chat terkait
          queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      } catch (err) {
        console.error("Gagal membaca payload SSE", err);
      }
    };

    return () => {
      evtSource.close();
    };
  }, [queryClient]);
}
