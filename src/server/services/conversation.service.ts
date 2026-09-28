import { db } from "@/db";
import { conversations, conversationParticipants, users, messages } from "@/db/schema/index";
import { and, desc, eq, ne, inArray, sql } from "drizzle-orm";

export class ConversationService {
  /**
   * Mengambil semua percakapan untuk user saat ini.
   */
  static async getUserConversations(currentUserId: string) {
    // Get all conversations for current user
    const userConversations = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, currentUserId),
    });

    const conversationIds = userConversations.map((c) => c.conversationId);

    if (conversationIds.length === 0) {
      return [];
    }

    // Find participants that are NOT the current user in these conversations
    const otherParticipants = await db.query.conversationParticipants.findMany({
      where: and(
        inArray(conversationParticipants.conversationId, conversationIds),
        ne(conversationParticipants.userId, currentUserId)
      ),
    });

    // Get users info
    const userIds = otherParticipants.map(p => p.userId);
    const otherUsers = userIds.length > 0 
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds),
          columns: { id: true, name: true, email: true }
        })
      : [];

    // Get conversations data for updatedAt
    const allConversations = await db.query.conversations.findMany({
      where: inArray(conversations.id, conversationIds),
    });

    // Get unread messages per conversation
    const unreadMessages = await db.query.messages.findMany({
      where: and(
        inArray(messages.conversationId, conversationIds),
        eq(messages.isRead, false),
        ne(messages.senderId, currentUserId)
      ),
    });

    // Get latest message per conversation
    const lastMessages = await db.query.messages.findMany({
      where: inArray(messages.conversationId, conversationIds),
      orderBy: [desc(messages.createdAt)],
    });

    const data = userConversations.map((uc) => {
      const otherParticipantRow = otherParticipants.find(p => p.conversationId === uc.conversationId);
      const otherUser = otherParticipantRow ? otherUsers.find(u => u.id === otherParticipantRow.userId) : null;
      const lastMsg = lastMessages.find(m => m.conversationId === uc.conversationId);
      const convData = allConversations.find(c => c.id === uc.conversationId);
      
      const unreadCount = unreadMessages.filter(m => m.conversationId === uc.conversationId).length;

      return {
        id: uc.conversationId,
        participant: otherUser,
        lastMessage: lastMsg ? {
          body: lastMsg.body,
          createdAt: lastMsg.createdAt
        } : null,
        updatedAt: convData?.updatedAt || new Date(),
        unreadCount
      };
    });

    // Sort by updatedAt descending
    data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return data;
  }

  /**
   * Membuat atau mengambil ID percakapan dengan target user.
   */
  static async createOrGetConversation(currentUserId: string, targetUserId: string) {
    if (targetUserId === currentUserId) {
      throw new Error("Tidak bisa chat dengan diri sendiri");
    }

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!targetUser) {
      const error = new Error("User tidak ditemukan");
      (error as any).status = 404;
      throw error;
    }

    // Check if direct conversation already exists
    const currentUserConvos = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, currentUserId)
    });

    const currentConvoIds = currentUserConvos.map(c => c.conversationId);

    if (currentConvoIds.length > 0) {
      const existing = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.userId, targetUserId),
          sql`${conversationParticipants.conversationId} IN ${currentConvoIds}`
        )
      });

      if (existing) {
        return existing.conversationId;
      }
    }

    // Create new conversation
    const [newConvo] = await db.insert(conversations).values({}).returning();

    await db.insert(conversationParticipants).values([
      { conversationId: newConvo.id, userId: currentUserId },
      { conversationId: newConvo.id, userId: targetUserId }
    ]);

    return newConvo.id;
  }
}
