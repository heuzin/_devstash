import { z } from "zod";

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1).nullable().optional(),
  content: z.string().min(1).nullable().optional(),
  url: z.url("Invalid URL").nullable().optional(),
  language: z.string().trim().min(1).nullable().optional(),
  tags: z.array(z.string().trim().min(1)),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
