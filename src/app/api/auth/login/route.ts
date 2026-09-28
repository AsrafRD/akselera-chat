import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema/index";
import { eq } from "drizzle-orm";
import { verify } from "@node-rs/argon2";
import { createSession } from "@/lib/auth/session";
import { LoginSchema } from "@/lib/validation";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const isValid = await verify(user.passwordHash, password);
    if (!isValid) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    await createSession(user.id, user.email);

    return NextResponse.json({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Format input tidak valid" }, { status: 400 });
    }
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
