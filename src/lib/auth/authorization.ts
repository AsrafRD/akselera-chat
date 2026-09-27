import { db } from "@/db";
import { conversationParticipants } from "@/db/schema/index";
import { and, eq } from "drizzle-orm";

export class ForbiddenError extends Error {
  constructor(message = "Akses ditolak: Anda bukan bagian dari percakapan ini") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireConversationAccess(
  conversationId: string,
  userId: string
) {
  const participant = await db.query.conversationParticipants.findFirst({
    where: and(
      eq(conversationParticipants.conversationId, conversationId),
      eq(conversationParticipants.userId, userId)
    ),
  });

  if (!participant) {
    throw new ForbiddenError();
  }

  return participant;
}
