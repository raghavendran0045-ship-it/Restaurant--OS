import { orderQuerySchema } from "../schemas/orderQuery";
import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z.string().min(2).optional(),

  customerPhone: z.string().min(10).optional(),

  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});
