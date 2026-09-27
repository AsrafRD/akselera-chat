# UI & Brand Guidelines

## 1. Brand Identity & Assets

- **Font**: `Nunito` (Wajib diisi di `layout.tsx` menggunakan `next/font/google` dan di-apply ke `<body>`).
- **Skema Warna Utama**:
  - Hitam: `#000000` (`bg-black`, `text-black`)
  - Putih: `#FFFFFF` (`bg-white`, `text-white`)
  - Netral Sekunder (Garis, Border, Background Alt): Tailwind `zinc-100`, `zinc-200`, `zinc-800`, `zinc-900`.
- **Aset Logo**:
  - **Light Mode**: Gunakan logo versi hitam `/public/logo-black.svg` (Sesuai Gambar Aset 1).
  - **Dark Mode**: Gunakan logo versi putih `/public/logo-white.svg` (Sesuai Gambar Aset 2).
  - Komponen Logo harus otomatis berganti source image tergantung mode tema yang aktif.

## 2. Layout & Wireframe Specs (Sesuai Acuan Wireframe)

### Layar 1: Login Screen (`/login`)

- Layout terpusat (Center Screen).
- **Header**: Logo Akselera.Tech di pojok kiri atas, Switcher Light/Dark Mode di pojok kanan atas.
- **Card Login**:
  - Judul: "Masuk" (Font Bold).
  - Input: Email (`type="email"`, placeholder `andi@contoh.id`).
  - Input: Password (`type="password"`).
  - Error Box: Latar kuning muda (`bg-amber-100 text-amber-900 border border-amber-300`) jika auth gagal dengan teks "Email atau password salah".
  - Tombol Submit: Warna hitam penuh (`bg-black text-white dark:bg-white dark:text-black`) teks "Masuk".

### Layar 2: Layout Chat (2 Panel Panel Utama)

- **Top Bar**: Logo Akselera.Tech di kiri, Nama User Aktif + Avatar Inisial (contoh: "Andi Pratama AP") & Toggle Light/Dark Mode di kanan.
- **Panel Kiri (Daftar Chat - Sidebar width ~320px - 360px)**:
  - Header: Input "Cari chat" + Tombol "+ Chat baru" (`bg-black text-white dark:bg-white dark:text-black`).
  - Item List Percakapan:
    - Circle Avatar Inisial Dua Huruf (contoh: "RK", "DP").
    - Nama Lawan Bicara (Font Semi-Bold).
    - Cuplikan Pesan Terakhir (Truncate / Ellipsis jika panjang).
    - Waktu Pesan Terakhir (Format: `09.42`, `Kemarin`, atau tanggal).
- **Panel Kanan (Empty State)**:
  - Jika belum ada percakapan dipilih: Icon Chat Netral + Teks "Pilih percakapan atau mulai chat baru".
  - Subteks: "Daftar hanya berisi percakapan milik akun yang login."

### Layar 3: Modal Chat Baru

- Dialog Modal Overlay (Background Semi-transparent backdrop).
- Card Modal:
  - Header: Teks "Chat baru" dan tombol "Tutup".
  - Search Bar: "Cari nama atau email".
  - List User Terdaftar (HANYA menampilkan user terdaftar SELAIN user yang sedang login):
    - Radio selection / Card item berisi Avatar Inisial, Nama, dan Email (contoh: "Bayu Nugroho - bayu@contoh.id").
  - Footer: Tombol "Mulai chat" di bagian bawah modal.

### Layar 4: Percakapan Aktif (Panel Kanan Terisi)

- **Header Chat**: Avatar Inisial, Nama Lawan Bicara, dan Email di bawah nama (contoh: "Maya Handayani - maya@contoh.id").
- **Area Message History**:
  - Badge Pembatas Tanggal di tengah (contoh: "Hari ini").
  - Bubble Pesan Pengirim (User Aktif): Aligned KANAN, background Hitam (`bg-black text-white dark:bg-zinc-800 dark:text-white`), menunjukkan teks pesan & jam terkirim (contoh: `10.02`).
  - Bubble Pesan Penerima (Lawan Bicara): Aligned KIRI, background Putih/Zinc (`bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700`), menunjukkan teks pesan & jam.
- **Input Bar (Bottom)**:
  - Input Teks: Rounded input placeholder "Tulis pesan".
  - Tombol "Kirim": Background hitam (`bg-black text-white`).
