import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireConversationAccess, ForbiddenError } from "@/lib/auth/authorization";
import { db } from "@/db";
import { messages, conversations, conversationParticipants } from "@/db/schema/index";
import { eq, asc, and, ne } from "drizzle-orm";
import { z } from "zod";
import { redis } from "@/lib/redis";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  try {
    await requireConversationAccess(conversationId, session.userId);

    // Mark messages as read
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

      // Publish read event to the sender (the other participant)
      const senderId = unreadMessages[0].senderId;
      await redis.publish(
        `user:${senderId}:messages`, 
        JSON.stringify({ type: 'messages_read', conversationId })
      );
    }

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
  body: z.string().max(2000, "Pesan terlalu panjang").optional().nullable().default(""),
  replyToId: z.string().uuid("ID Balasan tidak valid").optional().nullable(),
  isForwarded: z.boolean().optional(),
  attachmentUrl: z.string().url("URL Lampiran tidak valid").optional().nullable(),
  attachmentType: z.string().optional().nullable(),
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
    const { body, replyToId, isForwarded, attachmentUrl, attachmentType } = CreateMessageSchema.parse(reqBody);

    // Mencegah error DB NOT NULL constraint jika kirim gambar tanpa teks
    const safeBody = (body && body.trim() !== "") 
      ? body 
      : (attachmentType === 'image' ? '📷 Foto' : '📎 Lampiran');

    if (!safeBody && !attachmentUrl) {
      return NextResponse.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const [newMessage] = await db.insert(messages).values({
      conversationId,
      senderId: session.userId,
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

    // ----------------------------------------------------
    // REALTIME SSE VIA REDIS UPSTASH
    // ----------------------------------------------------
    // Cari lawan bicara untuk diberitahu secara spesifik (PubSub)
    const otherParticipantRow = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, session.userId)
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
