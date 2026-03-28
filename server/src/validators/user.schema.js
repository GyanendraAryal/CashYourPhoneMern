import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(1, "Password is required"),
  }).refine((data) => data.phone || data.email, {
    message: "Either phone or email must be provided",
    path: ["phone"],
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
  }),
});
