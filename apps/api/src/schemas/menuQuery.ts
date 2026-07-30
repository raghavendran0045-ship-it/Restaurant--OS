import { z } from "zod";

export const menuQuerySchema = z.object({
  search: z.string().trim().optional(),

  categoryId: z.string().optional(),

  isAvailable: z.enum(["true", "false"]).optional(),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),
});