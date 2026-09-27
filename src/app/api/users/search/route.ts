import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { users } from "@/db/schema/index";
import { ne, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = req.nextUrl.searchParams;
  const q = searchParams.get("q");

  if (!q || q.length < 1) {
    return NextResponse.json({ data: [] });
  }

  // WAJIB mengesampingkan user yang sedang terautentikasi (WHERE id != currentUserId)
  // Pencarian berdasarkan nama atau email yang mengandung query (ilike)
  const results = await db.query.users.findMany({
    where: and(
      ne(users.id, session.userId),
      or(
        ilike(users.name, `%${q}%`),
        ilike(users.email, `%${q}%`)
      )
    ),
    columns: {
      id: true,
      name: true,
      email: true
      // password_hash tidak disertakan sesuai instruksi di api-design.md
    },
    limit: 10
  });

  return NextResponse.json({ data: results });
}
