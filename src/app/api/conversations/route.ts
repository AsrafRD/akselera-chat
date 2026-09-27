import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/db";
import { conversations, conversationParticipants, users, messages } from "@/db/schema/index";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get all conversations for current user
  const userConversations = await db.query.conversationParticipants.findMany({
    where: eq(conversationParticipants.userId, session.userId),
  });

  const conversationIds = userConversations.map((c) => c.conversationId);

  if (conversationIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Find participants that are NOT the current user in these conversations
  const otherParticipants = await db.query.conversationParticipants.findMany({
    where: and(
      sql`${conversationParticipants.conversationId} IN ${conversationIds}`,
      ne(conversationParticipants.userId, session.userId)
    ),
  });

  // Get users info
  const userIds = otherParticipants.map(p => p.userId);
  const otherUsers = userIds.length > 0 
    ? await db.query.users.findMany({
        where: sql`${users.id} IN ${userIds}`,
        columns: { id: true, name: true, email: true }
      })
    : [];

  // Get conversations data for updatedAt
  const allConversations = await db.query.conversations.findMany({
    where: sql`${conversations.id} IN ${conversationIds}`,
  });

  // Get latest message per conversation
  // Note: For a true robust app we might use distinct on or a lateral join,
  // but for simplicity we fetch the last message for each conversation
  const lastMessages = await db.query.messages.findMany({
    where: sql`${messages.conversationId} IN ${conversationIds}`,
    orderBy: [desc(messages.createdAt)],
  });

  const data = userConversations.map((uc) => {
    const otherParticipantRow = otherParticipants.find(p => p.conversationId === uc.conversationId);
    const otherUser = otherParticipantRow ? otherUsers.find(u => u.id === otherParticipantRow.userId) : null;
    const lastMsg = lastMessages.find(m => m.conversationId === uc.conversationId);
    const convData = allConversations.find(c => c.id === uc.conversationId);

    return {
      id: uc.conversationId,
      participant: otherUser,
      lastMessage: lastMsg ? {
        body: lastMsg.body,
        createdAt: lastMsg.createdAt
      } : null,
      updatedAt: convData?.updatedAt || new Date()
    };
  });

  // Sort by updatedAt descending
  data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return NextResponse.json({ data });
}

const CreateConversationSchema = z.object({
  targetUserId: z.string().uuid()
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { targetUserId } = CreateConversationSchema.parse(body);

    if (targetUserId === session.userId) {
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
    // We look for a conversation where both users are participants
    const currentUserConvos = await db.query.conversationParticipants.findMany({
      where: eq(conversationParticipants.userId, session.userId)
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
        return NextResponse.json({ data: { conversationId: existing.conversationId } });
      }
    }

    // Create new conversation
    const [newConvo] = await db.insert(conversations).values({}).returning();

    await db.insert(conversationParticipants).values([
      { conversationId: newConvo.id, userId: session.userId },
      { conversationId: newConvo.id, userId: targetUserId }
    ]);

    return NextResponse.json({ data: { conversationId: newConvo.id } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
