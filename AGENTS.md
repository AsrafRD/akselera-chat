<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Akselera.Tech Chat Application - Master AI Rules

Proyek ini adalah Technical Task aplikasi chat internal 1-on-1 untuk Akselera.Tech. AI Coding Agent WAJIB mematuhi seluruh aturan arsitektur, keamanan, dan aturan visual di dalam repositori ini.

## Core Tech Stack

- **Framework**: Next.js (App Router, TypeScript)
- **Database**: Neon PostgreSQL (Serverless Postgres)
- **ORM**: Drizzle ORM
- **Authentication**: Custom JWT (`jose`) stored in HTTP-Only Cookies
- **Password Hashing**: Argon2id (`@node-rs/argon2`)
- **Styling**: Tailwind CSS (Murni, TANPA UI Component Library)
- **Icons**: Lucide React
- **Font**: Nunito via `next/font/google`
- **State Management**: TanStack Query (React Query) v5
- **Validation**: Zod

## Aturan Eksekusi

1. SEBELUM membuat/mengubah UI atau Komponen, BACA `.agents/ui-branding.md`.
2. SEBELUM membuat/mengubah Route Handler atau Middleware, BACA `.agents/security-auth.md`.
3. SEBELUM membuat/mengubah Schema atau Query Database, BACA `.agents/database-drizzle.md`.
4. SEBELUM membuat API Endpoint baru, BACA `.agents/api-design.md`.
5. SEBELUM membuat Custom Hooks atau Client Fetching, BACA `.agents/state-frontend.md`.

DILARANG KERAS menyimpang dari arsitektur 2-layer authorization dan constraint database yang telah ditentukan.
