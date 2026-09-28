import { db } from "@/db";
import { messages, conversations, conversationParticipants } from "@/db/schema/index";
import { eq, asc, desc, and, ne, lt } from "drizzle-orm";
import { redis } from "@/lib/redis";
import { requireConversationAccess } from "@/lib/auth/authorization";

export class MessageService {
  /**
   * Mengambil pesan dengan dukungan infinite scroll.
   */
  static async getMessages(conversationId: string, currentUserId: string, cursor?: string | null, limit: number = 30) {
    await requireConversationAccess(conversationId, currentUserId);

    // Tandai pesan sebagai dibaca
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false),
        ne(messages.senderId, currentUserId)
      )
    });

    if (unreadMessages.length > 0) {
      await db.update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.isRead, false),
            ne(messages.senderId, currentUserId)
          )
        );

      // Publish event read ke Redis
      const senderId = unreadMessages[0].senderId;
      await redis.publish(
        `user:${senderId}:messages`, 
        JSON.stringify({ type: 'messages_read', conversationId })
      );
    }

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

    // Balikkan urutan agar kronologis dari lama ke baru (dari atas ke bawah)
    return { data: convoMessages.reverse(), nextCursor };
  }

  /**
   * Membuat pesan baru di dalam percakapan dan mengirim event SSE.
   */
  static async createMessage(
    conversationId: string,
    currentUserId: string,
    payload: {
      body?: string | null;
      replyToId?: string | null;
      isForwarded?: boolean;
      attachmentUrl?: string | null;
      attachmentType?: string | null;
    }
  ) {
    await requireConversationAccess(conversationId, currentUserId);

    const { body, replyToId, isForwarded, attachmentUrl, attachmentType } = payload;

    const safeBody = (body && body.trim() !== "") 
      ? body 
      : (attachmentType === 'image' ? '📷 Foto' : '📎 Lampiran');

    if (!safeBody && !attachmentUrl) {
      throw new Error("Pesan tidak valid");
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

    return newMessage;
  }
}
