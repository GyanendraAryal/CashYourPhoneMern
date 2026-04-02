import { z } from "zod";

export const initiateEsewaSchema = z.object({
  body: z.object({
    orderId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid order ID"),
  }),
});

export const initiateEsewaCheckoutSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    email: z.string().optional(),
    address: z.string().min(1, "Address is required"),
  }),
});
