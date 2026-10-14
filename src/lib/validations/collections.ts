import { z } from "zod";

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1).nullable().optional(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
