import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";
import { CreateConversationSchema } from "@/lib/validation";
import { db } from "@/db";
import { conversations, conversationParticipants, users, messages } from "@/db/schema/index";
import { and, desc, eq, ne, inArray, sql } from "drizzle-orm";
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUserId = session.userId;

  // Get all conversations for current user
  const userConversations = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, currentUserId),
  });

  const conversationIds = userConversations.map((c) => c.conversationId);

  if (conversationIds.length === 0) {
    return NextResponse.json({ data: [] });
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

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { targetUserId } = CreateConversationSchema.parse(body);
    const currentUserId = session.userId;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: "Tidak bisa chat dengan diri sendiri" }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId)
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    // Check if direct conversation already exists
    const currentUserConvos = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, currentUserId)
    });

    const currentConvoIds = currentUserConvos.map(c => c.conversationId);

    let conversationId: string;

    if (currentConvoIds.length > 0) {
      const existing = await db.query.conversationParticipants.findFirst({
        where: and(
          eq(conversationParticipants.userId, targetUserId),
          sql`${conversationParticipants.conversationId} IN ${currentConvoIds}`
        )
      });

      if (existing) {
        conversationId = existing.conversationId;
      } else {
        const [newConvo] = await db.insert(conversations).values({}).returning();
        await db.insert(conversationParticipants).values([
          { conversationId: newConvo.id, userId: currentUserId },
          { conversationId: newConvo.id, userId: targetUserId }
        ]);
        conversationId = newConvo.id;
      }
    } else {
      const [newConvo] = await db.insert(conversations).values({}).returning();
      await db.insert(conversationParticipants).values([
        { conversationId: newConvo.id, userId: currentUserId },
        { conversationId: newConvo.id, userId: targetUserId }
      ]);
      conversationId = newConvo.id;
    }

    return NextResponse.json({ data: { conversationId } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
