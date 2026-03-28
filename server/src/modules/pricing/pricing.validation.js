import { z } from "zod";

export const estimateSchema = z.object({
  body: z.object({
    basePrice: z.number().min(0, "Base price must be a positive number"),
    condition: z.enum(["new", "like_new", "refurbished", "pre_owned"]),
  }),
});
