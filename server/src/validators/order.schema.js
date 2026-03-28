import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    contact: z.object({
      fullName: z.string().min(2, "Full name is required"),
      phone: z.string().min(10, "Valid phone number is required"),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      address: z.string().min(5, "Address must be at least 5 characters"),
    }),
    items: z.array(
      z.object({
        product: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
        qty: z.number().int().min(1, "Quantity must be at least 1"),
        // Note: price is typically determined server-side for security, 
        // but if sent for snapshotting, it must be validated.
        price: z.number().min(0).optional(),
      })
    ).min(1, "At least one item is required"),
    paymentProvider: z.enum(["esewa", "khalti", "bank"]).optional().default("esewa"),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(["created", "processing", "shipped", "completed", "cancelled"]),
    paymentStatus: z.enum(["unpaid", "paid", "refunded"]).optional(),
  }),
});
