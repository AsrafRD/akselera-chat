import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { requireConversationAccess, ForbiddenError } from "@/lib/auth/authorization";
import { db } from "@/db";
import { messages, conversationParticipants } from "@/db/schema/index";
import { eq, and, ne } from "drizzle-orm";
import { redis } from "@/lib/redis";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: conversationId, messageId } = await params;
    await requireConversationAccess(conversationId, session.userId);

    // Validasi apakah pesan ada dan milik user yang sedang login
    const msg = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId)
      )
    });

    if (!msg) return NextResponse.json({ error: "Pesan tidak ditemukan" }, { status: 404 });
    if (msg.senderId !== session.userId) return NextResponse.json({ error: "Anda tidak bisa menghapus pesan orang lain" }, { status: 403 });
    if (msg.isDeleted) return NextResponse.json({ error: "Pesan sudah ditarik sebelumnya" }, { status: 400 });

    // Tarik pesan (Soft delete, ubah teks, hapus attachment)
    await db.update(messages)
      .set({ 
        isDeleted: true, 
        body: "🚫 Pesan ini telah ditarik", 
        attachmentUrl: null,
        attachmentType: null
      })
      .where(eq(messages.id, messageId));

    // Notifikasi SSE agar UI lawan bicara ikut menghapus pesan secara realtime
    const otherParticipantRow = await db.query.conversationParticipants.findFirst({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        ne(conversationParticipants.userId, session.userId)
      )
    });

    if (otherParticipantRow) {
      await redis.publish(
        `user:${otherParticipantRow.userId}:messages`, 
        JSON.stringify({ type: 'message_deleted', conversationId, messageId })
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Delete message error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
