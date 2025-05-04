import { z } from "zod";

export const reviewCreateSchema = z.object({
  sessionId: z.number().int().positive(),
  targetId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewPatchSchema = z
  .object({
    rating: z.number().int().min(1).max(5).optional(),
    comment: z.string().max(1000).optional(),
  })
  .refine((d) => d.rating !== undefined || d.comment !== undefined, {
    message: "Nothing to update",
  });

export const reportSchema = z.object({
  reviewId: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});
