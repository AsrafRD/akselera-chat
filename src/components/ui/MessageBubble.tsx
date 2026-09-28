"use client";

import { ChevronDown, Reply, Trash2, Paperclip, Check, CheckCheck } from "lucide-react";
import type { Message } from "@/types";

interface MessageBubbleProps {
  msg: Message;
  isMe: boolean;
  currentUser: any;
  messages: Message[];
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  setReplyingTo: (msg: Message | null) => void;
  setEditingMessage?: (msg: Message | null) => void;
  deleteMessageMutate: (id: string) => void;
  setPreviewImage: (url: string) => void;
}

export function MessageBubble({
  msg,
  isMe,
  currentUser,
  messages,
  activeMenuId,
  setActiveMenuId,
  setReplyingTo,
  setEditingMessage,
  deleteMessageMutate,
  setPreviewImage
}: MessageBubbleProps) {
  return (
    <div id={`message-${msg.id}`} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'} group relative`}>
      {/* Context Menu Button */}
      <button 
        onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
        className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity`}
      >
        <ChevronDown size={16} />
      </button>
      
      {/* Context Menu Dropdown */}
      {activeMenuId === msg.id && (
        <div className={`absolute top-6 ${isMe ? 'left-[-120px]' : 'right-[-120px]'} w-32 bg-white dark:bg-zinc-900 shadow-xl rounded-lg py-1 border border-zinc-200 dark:border-zinc-800 z-50 text-black dark:text-white`}>
          <button 
            onClick={() => { setReplyingTo(msg); setActiveMenuId(null); }}
            className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
          >
            <Reply size={14} /> Balas
          </button>
          {isMe && !msg.isDeleted && (
            <>
              {setEditingMessage && (
                <button 
                  onClick={() => { setEditingMessage(msg); setActiveMenuId(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <ChevronDown size={14} className="rotate-[-90deg] opacity-0" /> Edit
                </button>
              )}
              <button 
                onClick={() => { deleteMessageMutate(msg.id); setActiveMenuId(null); }}
                className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <Trash2 size={14} /> Tarik
              </button>
            </>
          )}
        </div>
      )}

      <div className={`px-4 py-2.5 rounded-2xl text-sm flex flex-col ${isMe ? 'bg-black text-white dark:bg-zinc-800 dark:text-white rounded-br-sm' : 'bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 text-black dark:text-white rounded-bl-sm'}`}>
        
        {/* Replied Message Banner */}
        {msg.replyToId && !msg.isDeleted && (() => {
          const repliedMsg = messages.find(m => m.id === msg.replyToId);
          if (repliedMsg) {
            return (
              <div 
                onClick={() => {
                  document.getElementById(`message-${msg.replyToId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className="mb-2 bg-black/10 dark:bg-white/10 rounded border-l-4 border-black dark:border-white p-2 text-xs opacity-70 cursor-pointer hover:opacity-100 transition-opacity"
              >
                <p className="font-semibold">{repliedMsg.senderId === currentUser?.id ? "Anda" : "Lawan Bicara"}</p>
                <p className="truncate">{repliedMsg.isDeleted ? "🚫 Pesan ini telah ditarik" : repliedMsg.body}</p>
              </div>
            )
          }
        })()}

        {/* Attachment Rendering */}
        {msg.attachmentUrl && (
          <div className="mb-2 max-w-xs">
            {msg.attachmentType === 'image' ? (
              <img 
                src={msg.attachmentUrl} 
                alt="attachment" 
                onClick={() => setPreviewImage(msg.attachmentUrl!)}
                className="rounded-xl w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
              />
            ) : (
              <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className="underline break-all text-blue-500 text-xs flex items-center gap-1">
                <Paperclip size={14} /> Buka Lampiran
              </a>
            )}
          </div>
        )}

        <span className={msg.isDeleted ? "italic opacity-60" : ""}>{msg.body}</span>
      </div>
      <div className="flex items-center gap-1 mt-1 px-1">
        {msg.isEdited && !msg.isDeleted && (
          <span className="text-[10px] text-zinc-400 italic mr-1">
            (diedit)
          </span>
        )}
        <span className="text-[10px] text-zinc-500">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isMe && (
          <span className={`text-[12px] ${msg.isRead ? 'text-blue-500' : 'text-zinc-400'}`}>
            {msg.isRead ? <CheckCheck size={14} /> : <Check size={14} />}
          </span>
        )}
      </div>
    </div>
  );
}
