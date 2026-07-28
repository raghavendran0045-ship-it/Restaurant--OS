import { z } from "zod";

export const createMenuItemSchema = z.object({
  name: z.string().min(2).max(100),

  description: z.string().optional(),

  price: z.coerce.number().positive(),

  imageUrl: z.string().url().optional(),

  categoryId: z.string(),

  isAvailable: z.boolean().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(2).max(100).optional(),

  description: z.string().optional(),

  price: z.coerce.number().positive().optional(),

  imageUrl: z.string().url().optional(),

  categoryId: z.string().optional(),

  isAvailable: z.boolean().optional(),
});
