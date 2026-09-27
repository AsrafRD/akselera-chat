# REST API Specifications

Seluruh API Handler wajib bertindak sebagai REST API murni yang mengembalikan format JSON standar:

- Success: `{ "data": ... }`
- Error: `{ "error": "Pesan Error" }`

## List Endpoint Wajib

### 1. Auth Endpoint

- `POST /api/auth/login`
  - Input Body (Zod): `{ email: string(), password: string() }`
  - Output: Cookie `session` di-set, return `{ "data": { "id": "...", "name": "...", "email": "..." } }`
- `POST /api/auth/logout`
  - Output: Cookie `session` dihapus / expired.
- `GET /api/auth/me`
  - Output: Return profile data user terautentikasi saat ini.

### 2. User Search Endpoint

- `GET /api/users/search?q={query}`
  - Logika: Cari user berdasarkan `name` atau `email` yang mengandung kueri `{query}`.
  - **Constraint Penting**:
    - WAJIB mengesampingkan user yang sedang terautentikasi (`WHERE id != currentUserId`).
    - DILARANG RETURN field `password_hash`. Return hanya `id`, `name`, dan `email`.

### 3. Conversations Endpoint

- `GET /api/conversations`
  - Logika: Ambil daftar percakapan HANYA yang melibatkan `currentUserId`.
  - Output mencakup: `id`, `participant` (Nama & Email lawan bicara), `lastMessage` (Teks pesan terakhir & `createdAt`).
- `POST /api/conversations`
  - Input Body (Zod): `{ targetUserId: string() }`
  - Logika:
    1. Cek `findExistingDirectConversation(currentUserId, targetUserId)`.
    2. Jika ADA, return `conversationId` eksisting.
    3. Jika BELUM ADA, insert entri baru ke `conversations` dan 2 entri ke `conversation_participants`.

### 4. Messages Endpoint

- `GET /api/conversations/[id]/messages`
  - Validasi: WAJIB panggil `requireConversationAccess(id, currentUserId)`. Jika gagal, return status `403 Forbidden`.
  - Output: Array pesan diurutkan berdasarkan `createdAt ASC`.
- `POST /api/conversations/[id]/messages`
  - Validasi: WAJIB panggil `requireConversationAccess(id, currentUserId)`.
  - Input Body (Zod): `{ body: string().min(1) }`
  - Logika: Insert pesan ke tabel `messages`, update `updatedAt` pada tabel `conversations`.

```

```
