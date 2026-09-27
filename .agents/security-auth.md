# Security & Authorization Architecture (PRINSIP UTAMA #2)

## 1. Konsep Otorisasi 2 Lapisan

Request ---> [Layer 1: Next.js Middleware] ---> [Layer 2: Route Handler] ---> Response
(Authentication) (Authorization)
JWT Valid / Cookie? UserId Participant Check?

- **Layer 1 (Middleware / Authentication)**:
  - Memeriksa keberadaan & keabsahan JWT cookie (`session`).
  - Jika TIDAK VALID / TIDAK ADA: Block request API dengan status `401 Unauthorized`, atau redirect halaman UI ke `/login`.
  - HANYA menjawab: _"Apakah request ini datang dari user terautentikasi?"_

- **Layer 2 (Route Handler / Authorization)**:
  - Mengambil `currentUserId` dari data JWT hasil verify Layer 1.
  - Setiap endpoint yang mengakses `conversationId` WAJIB melakukan validasi partisipasi database.
  - HANYA menjawab: _"Apakah user ini BERHAK membaca/menulis di conversationId ini?"_

## 2. Helper Mandatory Otorisasi (`lib/auth/authorization.ts`)

Selalu gunakan helper fungsi berikut di seluruh API Route Handlers yang mengakses pesan atau detail percakapan:

```typescript
import { db } from "@/db";
import { conversationParticipants } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export class ForbiddenError extends Error {
  constructor(message = "Akses ditolak: Anda bukan bagian dari percakapan ini") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireConversationAccess(
  conversationId: string,
  userId: string
) {
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId)
    ),
  });

  if (!participant) {
    throw new ForbiddenError();
  }

  return participant;
}
3. Cookie Configuration & Session
Cookie Name: session

Flags: HttpOnly=true, Secure=process.env.NODE_ENV === 'production', SameSite=Lax, Path=/

Token Payload: { userId: string, email: string }

Secret Management: Gunakan JWT_SECRET dari environment variables (.env). DILARANG KERAS mengekspos secret ke Client Component ("use client").
```
