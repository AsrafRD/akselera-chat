import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/authorization";
import { z } from "zod";
import { CreateMessageSchema } from "@/lib/validation";
import { MessageService } from "@/server/services/message.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");

  try {
    const { data, nextCursor } = await MessageService.getMessages(conversationId, session.userId, cursor);
    return NextResponse.json({ data, nextCursor });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    const reqBody = await req.json();
    const payload = CreateMessageSchema.parse(reqBody);

    const newMessage = await MessageService.createMessage(conversationId, session.userId, payload);
    
    return NextResponse.json({ data: newMessage });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("Create message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
