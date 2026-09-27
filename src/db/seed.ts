import { db } from "./index";
import { users } from "./schema/index";
import { hash } from "@node-rs/argon2";

async function main() {
  console.log("Memulai proses seeding database...");

  const sampleUsers = [
    { name: "Andi Pratama", email: "andi@contoh.id", password: "password123" },
    { name: "Rina Kartika", email: "rina@contoh.id", password: "password123" },
    { name: "Bayu Nugroho", email: "bayu@contoh.id", password: "password123" },
    { name: "Maya Handayani", email: "maya@contoh.id", password: "password123" },
  ];

  for (const user of sampleUsers) {
    const passwordHash = await hash(user.password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // Insert data user, lewati jika email sudah ada (onConflictDoNothing)
    await db
      .insert(users)
      .values({
        name: user.name,
        email: user.email,
        passwordHash,
      })
      .onConflictDoNothing({ target: users.email });

    console.log(`User berhasil di-insert: ${user.email}`);
  }

  console.log("✅ Seeding database selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Terjadi kesalahan saat seeding database:", err);
  process.exit(1);
});
