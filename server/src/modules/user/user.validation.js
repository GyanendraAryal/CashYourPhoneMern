import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const loginSchema = z.object({
  body: z
    .object({
      // Single-field login (client sends this from AuthContext / Login page)
      emailOrPhone: z.string().optional(),
      phone: z.string().optional(),
      email: z.union([z.string().email(), z.literal("")]).optional(),
      password: z.string().min(1, "Password is required"),
    })
    .superRefine((data, ctx) => {
      const id = String(data.emailOrPhone || data.email || data.phone || "").trim();
      if (!id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Email or phone is required",
          path: ["emailOrPhone"],
        });
      }
    }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, "Identifier is required"),
    method: z.enum(["otp", "email"]).default("otp"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().optional(),
    identifier: z.string().optional(),
    otp: z.string().optional(),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
  }),
});
