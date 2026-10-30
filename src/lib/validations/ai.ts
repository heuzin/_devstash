import { z } from "zod";

export const generateAutoTagsSchema = z.object({
  itemTypeName: z.string().trim().max(50).nullable().optional(),
  title: z.string().trim().min(1, "Add a title before suggesting tags").max(200),
  description: z.string().max(1000).nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().max(2000).nullable().optional(),
  existingTags: z.array(z.string().max(50)).max(50),
});

export type GenerateAutoTagsInput = z.infer<typeof generateAutoTagsSchema>;

export const generateDescriptionSchema = z.object({
  itemTypeName: z.string().trim().max(50).nullable().optional(),
  title: z.string().trim().min(1, "Add a title before generating a description").max(200),
  description: z.string().max(1000).nullable().optional(),
  content: z.string().nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  url: z.string().max(2000).nullable().optional(),
  fileName: z.string().max(255).nullable().optional(),
  tags: z.array(z.string().max(50)).max(50),
});

export type GenerateDescriptionInput = z.infer<typeof generateDescriptionSchema>;
