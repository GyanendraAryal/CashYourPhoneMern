import { z } from "zod";

const ALLOWED_CONDITIONS = ["new", "like_new", "pre_owned", "refurbished"];
const ALLOWED_AVAILABILITY = ["in_stock", "out_of_stock", "coming_soon"];

export const deviceSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Device name is required").max(200),
    brand: z.string().min(1, "Brand is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    feature: z.string().optional(),
    description: z.string().optional(),
    condition: z.enum(ALLOWED_CONDITIONS).default("new"),
    availability: z.enum(ALLOWED_AVAILABILITY).default("in_stock"),
    featured: z.coerce.boolean().optional().default(false),
    images: z.array(z.string().url("Invalid image URL")).optional(),
    thumbnail: z.string().url("Invalid thumbnail URL").optional(),
  }),
});

export const updateDeviceSchema = z.object({ body: deviceSchema.shape.body.partial() });
