import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";
import { CreateConversationSchema } from "@/lib/validation";
import { ConversationService } from "@/server/services/conversation.service";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await ConversationService.getUserConversations(session.userId);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { targetUserId } = CreateConversationSchema.parse(body);
    const conversationId = await ConversationService.createOrGetConversation(session.userId, targetUserId);
    return NextResponse.json({ data: { conversationId } });
  } catch (error: any) {
    if (error.message === "Tidak bisa chat dengan diri sendiri") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error.message === "User tidak ditemukan") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
