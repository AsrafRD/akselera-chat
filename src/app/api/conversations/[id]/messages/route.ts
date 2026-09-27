import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireConversationAccess, ForbiddenError } from "@/lib/auth/authorization";
import { db } from "@/db";
import { messages, conversations } from "@/db/schema/index";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    await requireConversationAccess(conversationId, session.userId);

    const convoMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [asc(messages.createdAt)]
    });

    return NextResponse.json({ data: convoMessages });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Get messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

const CreateMessageSchema = z.object({
  body: z.string().min(1, "Pesan tidak boleh kosong")
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    await requireConversationAccess(conversationId, session.userId);

    const reqBody = await req.json();
    const { body } = CreateMessageSchema.parse(reqBody);

    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: session.userId,
      body,
    }).returning();

    // Update conversation updatedAt
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

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
