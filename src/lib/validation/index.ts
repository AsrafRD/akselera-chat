import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

export const CreateMessageSchema = z.object({
  body: z.string().max(2000, "Pesan terlalu panjang").optional().nullable().default(""),
  replyToId: z.string().uuid("ID Balasan tidak valid").optional().nullable(),
  isForwarded: z.boolean().optional(),
  attachmentUrl: z.string().url("URL Lampiran tidak valid").optional().nullable(),
  attachmentType: z.string().optional().nullable(),
});

export const CreateConversationSchema = z.object({
  targetUserId: z.string().uuid("ID Target tidak valid")
});
