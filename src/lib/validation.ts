import { z } from "zod";

export const exampleItemSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  createdAt: z.date().optional(),
});

export type ExampleItem = z.infer<typeof exampleItemSchema>;

