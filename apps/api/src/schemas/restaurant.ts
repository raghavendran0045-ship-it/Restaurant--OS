import { z } from "zod";

export const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(3, "Restaurant name must be at least 3 characters")
    .max(100),
});

export const updateRestaurantSchema = z.object({
  name: z
    .string()
    .min(3, "Restaurant name must be at least 3 characters")
    .max(100),
});