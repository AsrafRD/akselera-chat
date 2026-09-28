import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { ForbiddenError } from "@/lib/auth/authorization";
import { z } from "zod";
import { CreateMessageSchema } from "@/lib/validation";
import { db } from "@/db";
import { messages, conversations, conversationParticipants } from "@/db/schema/index";
import { eq, asc, desc, and, ne, lt } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { requireConversationAccess } from "@/lib/auth/authorization";

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
    await requireConversationAccess(conversationId, session.userId);

    // Tandai pesan sebagai dibaca
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        ne(messages.senderId, session.userId)
      )
    });

    if (unreadMessages.length > 0) {
      await db.update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.isRead, false),
            ne(messages.senderId, session.userId)
          )
        );

      // Publish event read ke Redis
      const senderId = unreadMessages[0].senderId;
      await redis.publish(
        `user:${senderId}:messages`, 
        JSON.stringify({ type: 'messages_read', conversationId })
      );
    }

    let limit = 30;
    let whereClause = eq(messages.conversationId, conversationId);
    if (cursor) {
      whereClause = and(whereClause, lt(messages.createdAt, new Date(cursor))) as any;
    }

    const convoMessages = await db.query.messages.findMany({
      where: whereClause,
      orderBy: [desc(messages.createdAt)],
      limit: limit + 1
    });

    let nextCursor: string | null = null;
    if (convoMessages.length > limit) {
      const nextMessage = convoMessages.pop(); // Remove the 31st item
      nextCursor = nextMessage!.createdAt.toISOString();
    }

    const data = convoMessages.reverse();

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

    await requireConversationAccess(conversationId, session.userId);

    const { body, replyToId, isForwarded, attachmentUrl, attachmentType } = payload;
    const currentUserId = session.userId;

    const safeBody = (body && body.trim() !== "") 
      ? body 
      : (attachmentType === 'image' ? '📷 Foto' : '📎 Lampiran');

    if (!safeBody && !attachmentUrl) {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: currentUserId,
      body: safeBody,
      replyToId,
      isForwarded: isForwarded || false,
      attachmentUrl,
      attachmentType,
    }).returning();

    // Update conversation updatedAt
    await db.update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));

    // Kirim event SSE
    const otherParticipantRow = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, currentUserId)
      )
    });

    if (otherParticipantRow) {
      await redis.publish(
        `user:${otherParticipantRow.userId}:messages`, 
        JSON.stringify({ type: 'new_message', conversationId })
      );
    }
    
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
