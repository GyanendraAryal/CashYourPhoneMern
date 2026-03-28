import { z } from "zod";

export const deviceSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Device name is required"),
    brand: z.string().min(1).optional(),
    price: z.preprocess((val) => Number(val), z.number().min(0)),
    condition: z.enum(["new", "like_new", "pre_owned", "refurbished"]).optional(),
    availability: z.enum(["in_stock", "out_of_stock", "coming_soon"]).optional().default("in_stock"),
    featured: z.preprocess((val) => val === "true" || val === true, z.boolean()).optional().default(false),
    description: z.string().optional(),
    feature: z.string().optional(),
    slug: z.string().optional(),
  }),
});

export const updateDeviceSchema = z.object({ body: deviceSchema.shape.body.partial() });
