# Frontend State & Client Management Guidelines

## 1. TanStack Query (React Query)

Gunakan TanStack Query v5 untuk mengelola client state, fetching, serta update UI secara efisien.

- **Query Keys Standard**:
  - Chat List: `['conversations']`
  - Messages List: `['messages', conversationId]`
  - User Search: `['users', 'search', searchQuery]`

- **Optimistic Updates saat Kirim Pesan**:
  Saat user menekan tombol "Kirim", append pesan secara lokal di UI sebelum response server diterima untuk memberikan pengalaman instant UI:

```typescript
const queryClient = useQueryClient();

const sendMessageMutation = useMutation({
  mutationFn: async (text: string) => {
    return fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    }).then((res) => res.json());
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  },
});
```
