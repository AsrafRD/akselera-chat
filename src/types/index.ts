export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  isDeleted?: boolean;
  isForwarded?: boolean;
  replyToId?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant: { id: string; name: string; email: string } | null;
  lastMessage: { body: string; createdAt: string } | null;
  updatedAt: string;
  unreadCount: number;
}
