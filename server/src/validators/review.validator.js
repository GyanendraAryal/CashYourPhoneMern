import { z } from "zod";

const toTrimmedString = (max, fieldName) =>
  z
    .string({ required_error: `${fieldName} is required` })
    .transform((v) => String(v ?? "").trim())
    .refine((v) => v.length > 0, `${fieldName} is required`)
    .refine((v) => v.length <= max, `${fieldName} is too long (max ${max} chars)`);

export const createReviewSchema = z.object({
  name: toTrimmedString(80, "name"),
  designation: z
    .union([z.string(), z.undefined(), z.null()])
    .transform((v) => (v == null ? "Customer" : String(v).trim() || "Customer"))
    .refine((v) => v.length <= 60, "designation is too long (max 60 chars)"),
  // rating comes as string in multipart forms; coerce
  rating: z.coerce
    .number({ required_error: "rating is required" })
    .min(1, "rating must be 1 to 5")
    .max(5, "rating must be 1 to 5"),
  // allow "message" or legacy "content"
  message: z.union([z.string().optional(), z.undefined(), z.null()]).optional(),
  content: z.union([z.string().optional(), z.undefined(), z.null()]).optional(),
}).transform((obj) => {
  const finalMessage = String(obj.message ?? obj.content ?? "").trim();
  return {
    ...obj,
    message: finalMessage,
  };
}).refine((obj) => obj.message && obj.message.length > 0, {
  path: ["message"],
  message: "message is required",
}).refine((obj) => obj.message.length <= 1200, {
  path: ["message"],
  message: "message is too long (max 1200 chars)",
});
