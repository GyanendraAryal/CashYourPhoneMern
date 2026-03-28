import { z } from "zod";

export const initiateEsewaSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
  }),
});
