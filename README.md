# Akselera-Chat

Akselera-Chat adalah aplikasi percakapan internal (1-on-1) real-time yang dirancang untuk Akselera.Tech, mengutamakan performa, keamanan berlapis, dan struktur basis data yang solid.

## 🚀 Stack & Infrastruktur

Proyek ini dibangun menggunakan teknologi modern untuk memastikan aplikasi berjalan sangat cepat, hemat biaya, dan _scalable_:

- **Framework**: **Next.js 16 (App Router) dengan Turbopack**
  - _Alasan_: Menawarkan _Server-Side Rendering_ (SSR) mumpuni, _Route Handlers_ untuk API terintegrasi, dan _developer experience_ yang cepat menggunakan Turbopack.
- **Database**: **Neon PostgreSQL (Serverless)**
  - _Alasan_: Mendukung _scale-to-zero_ yang sangat hemat biaya, _connection pooling_ bawaan, dan latensi rendah untuk aplikasi serverless/Edge.
- **ORM**: **Drizzle ORM**
  - _Alasan_: ORM TypeScript yang sangat ringan (tanpa _heavy runtime_ seperti Prisma), performa tinggi, dan Type-Safe dari ujung ke ujung.
- **Authentication**: **Custom JWT (`jose`) + HTTP-Only Cookies + Argon2id**
  - _Alasan_: Tidak menggunakan Auth eksternal berbayar. _Argon2id_ adalah algoritma hashing pemenang _Password Hashing Competition_ (sangat aman terhadap brute-force), dan token disimpan di _HTTP-Only Cookies_ agar kebal dari serangan XSS.
- **Styling**: **Tailwind CSS (Murni)**
  - _Alasan_: Sesuai persyaratan untuk _zero-tolerance_ terhadap UI Component Library eksternal, membuat _bundle size_ tetap minimal dan desain eksklusif.
- **Realtime Pub/Sub**: **Upstash Redis + Server-Sent Events (SSE)**
  - _Alasan_: Menghindari keborosan _polling_ HTTP. Redis mendistribusikan _event_ secara instan ke _client_ yang terkoneksi tanpa _overhead_ WebSocket (Socket.io).
- **State Management**: **TanStack Query (React Query v5)**
  - _Alasan_: Handal dalam mengatur sinkronisasi data _server-state_, mendukung _Infinite Scroll_, _Optimistic Updates_, dan manajemen _cache_ yang cerdas.

## 💻 Cara Menjalankan Secara Lokal

1. **Clone Repositori & Install Dependencies**

   ```bash
   git clone <repo-url>
   cd akselera-chat
   npm install
   ```

2. **Setup Environment Variables**
   Buat file `.env` di _root_ direktori dan isikan nilai berikut:

   ```env
   NODE_ENV="development"
   DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"
   JWT_SECRET="minimal-32-karakter-rahasia-anda"

   # Untuk Upload Gambar (Opsional jika ingin test fitur lampiran)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="..."

   # Untuk Realtime (Upstash)
   UPSTASH_REDIS_URL="..."
   ```

3. **Sinkronisasi Database (Drizzle Push) & Seeding**
   Pastikan struktur tabel di Neon DB Anda sudah sinkron, lalu isi data _dummy_ pengguna awal:

   ```bash
   npm run db:push
   npm run db:seed
   ```

   _(Data user dummy: andi@contoh.id, rina@contoh.id, dll dengan password: password123)_

4. **Jalankan Development Server**
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:3000`.

## 🗄️ Struktur Tabel (Schema)

Terdapat 4 tabel utama yang direlasikan dengan ketat (_Foreign Key & Cascading_):

1. **`users`**
   - Menyimpan kredensial (`email`, `password_hash`).
2. **`conversations`**
   - Menjadi _anchor_ atau penanda sesi obrolan (menyimpan kapan _chat_ terakhir aktif via `updatedAt`).
3. **`conversation_participants`** (Tabel Pivot/Mapping)
   - Memetakan `conversationId` ke `userId`.
   - Menggunakan relasi **One-to-One constraints** (`unique_conversation_user_idx`) agar tidak ada data ganda (1 chat hanya berisi tepat 2 user yang sama).
4. **`messages`**
   - Menyimpan `body`, `senderId`, status baca (`isRead`), status ditarik (`isDeleted`), lampiran (`attachmentUrl`), hingga _flag_ diedit (`isEdited`).

## 🤖 AI Tools yang Digunakan

- **Google Antigravity (Deepmind AAC)**: Digunakan secara otonom dalam merancang keseluruhan arsitektur, memperbaiki _bugs_ (_Hydration Error_, _SSE Stream Controller_), melakukan refaktorisasi pola _Services_, hingga mengimplementasikan _Infinite Scrolling_ dan komunikasi Redis.

## 🚧 Hal / Fitur yang Masih Belum Selesai (Pending)

Meski fungsionalitas inti telah berjalan sangat baik, terdapat beberapa bagian yang dapat ditingkatkan (sesuai _request_ tahap selanjutnya):

1. **Status Online / Indikator "Typing..."**: Belum diimplementasikan sepenuhnya di _Frontend_ meskipun arsitektur Redis Pub/Sub sudah siap untuk menerima _event_ tersebut.
2. **Forward Message**: UI untuk memilih obrolan tujuan _forward_ (_Meneruskan Pesan_) belum tersedia.
3. **Validasi MIME Type Cloudinary yang Lebih Ketat**: Validasi ukuran file dan tipe gambar sebaiknya diperkuat di sisi _Server Route Handler_ (saat ini _upload_ dilakukan _direct_ dari _client_).
4. **Push Notifications (PWA)**: Belum ada notifikasi natif browser apabila _tab_ ditutup.
