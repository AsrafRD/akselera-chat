# Akselera-Chat

Akselera-Chat adalah aplikasi percakapan internal (1-on-1) real-time yang dirancang untuk Akselera.Tech, mengutamakan performa, keamanan berlapis, dan struktur basis data yang solid.

## 🚀 Stack & Infrastruktur
Proyek ini dibangun menggunakan teknologi modern untuk memastikan aplikasi berjalan sangat cepat, hemat biaya, dan *scalable*:

- **Framework**: **Next.js 16 (App Router) dengan Turbopack**
  - *Alasan*: Menawarkan *Server-Side Rendering* (SSR) mumpuni, *Route Handlers* untuk API terintegrasi, dan *developer experience* yang cepat menggunakan Turbopack.
- **Database**: **Neon PostgreSQL (Serverless)**
  - *Alasan*: Mendukung *scale-to-zero* yang sangat hemat biaya, *connection pooling* bawaan, dan latensi rendah untuk aplikasi serverless/Edge.
- **ORM**: **Drizzle ORM**
  - *Alasan*: ORM TypeScript yang sangat ringan (tanpa *heavy runtime* seperti Prisma), performa tinggi, dan Type-Safe dari ujung ke ujung.
- **Authentication**: **Custom JWT (`jose`) + HTTP-Only Cookies + Argon2id**
  - *Alasan*: Tidak menggunakan Auth eksternal berbayar. *Argon2id* adalah algoritma hashing pemenang *Password Hashing Competition* (sangat aman terhadap brute-force), dan token disimpan di *HTTP-Only Cookies* agar kebal dari serangan XSS.
- **Styling**: **Tailwind CSS (Murni)**
  - *Alasan*: Sesuai persyaratan untuk *zero-tolerance* terhadap UI Component Library eksternal, membuat *bundle size* tetap minimal dan desain eksklusif.
- **Realtime Pub/Sub**: **Upstash Redis + Server-Sent Events (SSE)**
  - *Alasan*: Menghindari keborosan *polling* HTTP. Redis mendistribusikan *event* secara instan ke *client* yang terkoneksi tanpa *overhead* WebSocket (Socket.io).
- **State Management**: **TanStack Query (React Query v5)**
  - *Alasan*: Handal dalam mengatur sinkronisasi data *server-state*, mendukung *Infinite Scroll*, *Optimistic Updates*, dan manajemen *cache* yang cerdas.

## 💻 Cara Menjalankan Secara Lokal

1. **Clone Repositori & Install Dependencies**
   ```bash
   git clone <repo-url>
   cd akselera-chat
   npm install
   ```

2. **Setup Environment Variables**
   Buat file `.env` di *root* direktori dan isikan nilai berikut:
   ```env
   NODE_ENV="development"
   DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"
   JWT_SECRET="minimal-32-karakter-rahasia-anda"
   
   # Untuk Upload Gambar (Opsional jika ingin test fitur lampiran)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="..."
   
   # Untuk Realtime (Upstash)
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```

3. **Sinkronisasi Database (Drizzle Push) & Seeding**
   Pastikan struktur tabel di Neon DB Anda sudah sinkron, lalu isi data *dummy* pengguna awal:
   ```bash
   npm run db:push
   npm run db:seed
   ```
   *(Data user dummy: andi@contoh.id, rina@contoh.id, dll dengan password: password123)*

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

## 🗄️ Struktur Tabel (Schema)

Terdapat 4 tabel utama yang direlasikan dengan ketat (*Foreign Key & Cascading*):

1. **`users`**
   - Menyimpan kredensial (`email`, `password_hash`).
2. **`conversations`**
   - Menjadi *anchor* atau penanda sesi obrolan (menyimpan kapan *chat* terakhir aktif via `updatedAt`).
3. **`conversation_participants`** (Tabel Pivot/Mapping)
   - Memetakan `conversationId` ke `userId`.
   - Menggunakan relasi **One-to-One constraints** (`unique_conversation_user_idx`) agar tidak ada data ganda (1 chat hanya berisi tepat 2 user yang sama).
4. **`messages`**
   - Menyimpan `body`, `senderId`, status baca (`isRead`), status ditarik (`isDeleted`), lampiran (`attachmentUrl`), hingga *flag* diedit (`isEdited`).

## 🤖 AI Tools yang Digunakan

- **Google Antigravity (Deepmind AAC)**: Digunakan secara otonom dalam merancang keseluruhan arsitektur, memperbaiki *bugs* (*Hydration Error*, *SSE Stream Controller*), melakukan refaktorisasi pola *Services*, hingga mengimplementasikan *Infinite Scrolling* dan komunikasi Redis.

## 🚧 Hal / Fitur yang Masih Belum Selesai (Pending)

Meski fungsionalitas inti telah berjalan sangat baik, terdapat beberapa bagian yang dapat ditingkatkan (sesuai *request* tahap selanjutnya):
1. **Status Online / Indikator "Typing..."**: Belum diimplementasikan sepenuhnya di *Frontend* meskipun arsitektur Redis Pub/Sub sudah siap untuk menerima *event* tersebut.
2. **Forward Message**: UI untuk memilih obrolan tujuan *forward* (*Meneruskan Pesan*) belum tersedia.
3. **Validasi MIME Type Cloudinary yang Lebih Ketat**: Validasi ukuran file dan tipe gambar sebaiknya diperkuat di sisi *Server Route Handler* (saat ini *upload* dilakukan *direct* dari *client*). 
4. **Push Notifications (PWA)**: Belum ada notifikasi natif browser apabila *tab* ditutup.
