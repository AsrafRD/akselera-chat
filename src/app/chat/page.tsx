"use client";

import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { NewChatModal } from "@/components/chat/NewChatModal";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { Lightbox } from "@/components/ui/Lightbox";
import { Search, Plus, MessageSquare, LogOut, Send, Paperclip, Trash2, Reply, X, Image as ImageIcon, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useConversations } from "@/hooks/useConversations";
import { useMessages, useSendMessage, useDeleteMessage, useEditMessage } from "@/hooks/useMessages";
import type { Message } from "@/types";
import { useRealtimeSSE } from "@/hooks/useRealtimeSSE";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check, CheckCheck } from "lucide-react";

export default function ChatPage() {
  // Aktivasi listener SSE untuk Realtime tanpa polling boros!
  useRealtimeSSE();

  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // Fitur Upload, Reply, & Interaksi Pesan
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil Data Profile (Current User)
  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) throw new Error("Gagal mengambil data user");
      const { data } = await res.json();
      return data;
    },
  });

  // Data List Chat dari Server
  const { data: conversations = [], isLoading: isLoadingChats } = useConversations();
  
  // Data Pesan (Active Chat) dari Server dengan Infinite Scroll
  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useMessages(activeChatId);
  
  const messages = messagesData?.pages.slice().reverse().flatMap(page => page.data) || [];
  const sendMessage = useSendMessage(activeChatId);
  const deleteMessage = useDeleteMessage(activeChatId);
  const editMessage = useEditMessage(activeChatId);

  // Cari chat berdasarkan input di Sidebar
  const filteredChats = conversations.filter((c) => 
    c.participant?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.participant?.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChatDetails = conversations.find(c => c.id === activeChatId);

  // Secara otomatis me-refresh daftar percakapan (untuk reset unread badge) 
  // sesaat setelah meng-klik percakapan baru.
  useEffect(() => {
    if (activeChatId) {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  }, [activeChatId, queryClient]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !attachmentUrl) || !activeChatId) return;

    if (editingMessage) {
      editMessage.mutate({
        messageId: editingMessage.id,
        newBody: messageInput.trim()
      });
      setEditingMessage(null);
    } else {
      sendMessage.mutate({ 
        text: messageInput.trim(), 
        replyToId: replyingTo?.id,
        attachmentUrl,
        attachmentType
      });
    }

    setMessageInput("");
    setReplyingTo(null);
    setAttachmentUrl(null);
    setAttachmentType(null);
  };

  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("File maksimal 5MB");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setAttachmentUrl(data.secure_url);
      setAttachmentType(file.type.startsWith("image/") ? "image" : "document");
    } catch (error) {
      alert("Gagal mengupload file ke Cloudinary.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <img src="/logo-black.png" alt="Akselera.Tech" className="h-24 dark:hidden block" />
          <img src="/logo-white.png" alt="Akselera.Tech" className="h-24 hidden dark:block" />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeSwitcher />
          
          <div className="flex items-center gap-3 border-l border-zinc-200 dark:border-zinc-800 pl-3 sm:pl-4 group relative">
            <div className="text-sm font-semibold text-right hidden sm:block">
              <div>{currentUser?.name || "Memuat..."}</div>
              <div className="text-xs text-zinc-500 font-normal">{currentUser?.email || "..."}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm">
              {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : "?"}
            </div>
            <button 
              onClick={handleLogout}
              title="Logout"
              className="ml-2 p-2 rounded-full text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout (2 Panel) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Panel Kiri - Daftar Chat */}
        <aside className={`w-full sm:w-[320px] md:w-[360px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 shrink-0 transition-transform ${activeChatId ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 flex flex-col gap-3 shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              Chat baru
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Cari chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 rounded-lg text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingChats ? (
              <div className="p-6 text-center text-zinc-500 text-sm">Memuat daftar chat...</div>
            ) : filteredChats.length > 0 ? (
              filteredChats.map((chat) => (
                <button 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors border-b border-zinc-100 dark:border-zinc-800/50 ${activeChatId === chat.id ? 'bg-zinc-50 dark:bg-zinc-900' : ''}`}
                >
                  <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm">
                    {chat.participant?.name ? chat.participant.name.substring(0, 2).toUpperCase() : "??"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-semibold text-sm truncate pr-2">{chat.participant?.name || "Unknown"}</h3>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {chat.lastMessage?.createdAt ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate pr-2 ${(chat.id !== activeChatId && chat.unreadCount > 0) ? 'text-black dark:text-white font-semibold' : 'text-zinc-500'}`}>
                        {chat.lastMessage?.body || "Belum ada pesan"}
                      </p>
                      {(chat.id !== activeChatId && chat.unreadCount > 0) && (
                        <div className="h-5 min-w-[20px] rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold px-1.5 shrink-0">
                          {chat.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-6 text-center text-zinc-500 text-sm">
                Tidak ada percakapan
              </div>
            )}
          </div>
        </aside>

        {/* Panel Kanan */}
        {activeChatId ? (
          <section className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950/50 h-full relative z-10 w-full sm:w-auto">
             {/* Header Active Chat */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shrink-0">
              <button 
                onClick={() => setActiveChatId(null)}
                className="sm:hidden p-2 -ml-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ←
              </button>
              <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold text-sm">
                {activeChatDetails?.participant?.name ? activeChatDetails.participant.name.substring(0, 2).toUpperCase() : "??"}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{activeChatDetails?.participant?.name}</span>
                <span className="text-xs text-zinc-500">{activeChatDetails?.participant?.email}</span>
              </div>
            </div>

            {/* Message History Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
              {isLoadingMessages ? (
                <div className="text-center text-zinc-500 text-sm mt-4">Memuat pesan...</div>
              ) : (
                <>
                  {hasNextPage && (
                    <div className="flex justify-center py-2">
                      <button 
                        onClick={() => fetchNextPage()} 
                        disabled={isFetchingNextPage}
                        className="text-xs bg-zinc-100 dark:bg-zinc-900 text-zinc-500 px-3 py-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {isFetchingNextPage ? "Memuat..." : "Muat pesan lama"}
                      </button>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.id || msg.senderId.includes("optimistic");
                return (
                  <MessageBubble 
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    currentUser={currentUser}
                    messages={messages}
                    activeMenuId={activeMenuId}
                    setActiveMenuId={setActiveMenuId}
                    setReplyingTo={setReplyingTo}
                    setEditingMessage={(msg) => {
                      setEditingMessage(msg);
                      setMessageInput(msg?.body || "");
                      setReplyingTo(null);
                      setAttachmentUrl(null);
                      setAttachmentType(null);
                    }}
                    deleteMessageMutate={deleteMessage.mutate}
                    setPreviewImage={setPreviewImage}
                  />
                );
              })}
              </>
              )}
            </div>
            {/* Input Bar */}
            <div className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 shrink-0 relative">
              
              {/* Replying Banner */}
              {replyingTo && !editingMessage && (
                <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border-l-4 border-blue-500 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col text-xs truncate mr-4">
                    <span className="font-semibold text-blue-500">Membalas pesan...</span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{replyingTo.body}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-zinc-500 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Editing Banner */}
              {editingMessage && (
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-l-4 border-blue-600 dark:border-blue-400 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-col text-xs truncate mr-4">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Mengedit Pesan</span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">{editingMessage.body}</span>
                  </div>
                  <button onClick={() => { setEditingMessage(null); setMessageInput(""); }} className="text-zinc-500 hover:text-red-500">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Attachment Banner */}
              {attachmentUrl && (
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    {attachmentType === "image" ? (
                      <div className="h-12 w-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                        <img src={attachmentUrl} alt="preview" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                        <Paperclip size={20} />
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-black dark:text-white">Lampiran Siap Dikirim</span>
                      <span className="text-xs text-zinc-500 truncate max-w-[200px]">{attachmentUrl.split('/').pop()}</span>
                    </div>
                  </div>
                  <button onClick={() => { setAttachmentUrl(null); setAttachmentType(null); }} className="p-2 rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                    <X size={18} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="p-4 flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleUploadAttachment} 
                  className="hidden" 
                  accept="image/*,.pdf,.doc,.docx"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors disabled:opacity-50"
                  title="Lampirkan File"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                </button>
                <input
                  type="text"
                  placeholder={isUploading ? "Mengunggah file..." : "Tulis pesan"}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={isUploading}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-transparent dark:border-zinc-800 focus:border-zinc-300 dark:focus:border-zinc-700 rounded-full px-5 py-2.5 text-sm outline-none"
                />
                <button
                  type="submit"
                  disabled={(!messageInput.trim() && !attachmentUrl) || sendMessage.isPending || isUploading}
                  className="h-10 w-10 shrink-0 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={16} className="ml-1" />
                </button>
              </form>
            </div>
          </section>
        ) : (
          <section className="flex-1 hidden sm:flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 p-6">
            <div className="h-16 w-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-zinc-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-center">Pilih percakapan atau mulai chat baru</h2>
            <p className="text-sm text-zinc-500 text-center max-w-sm">
              Daftar hanya berisi percakapan milik akun yang login.
            </p>
          </section>
        )}
      </main>

      <NewChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Lightbox imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
