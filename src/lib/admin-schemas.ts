import { z } from "zod";

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  classTarget: z.string().min(1, "Class is required"),
  readingTime: z.coerce.number().int().positive("Reading time must be > 0"),
  duration: z.coerce.number().int().positive("Duration must be > 0"),
  totalMarks: z.coerce.number().int().positive("Total marks must be > 0"),
  examPassword: z.string().min(4, "Exam password must be at least 4 characters"),
  isActive: z.boolean().default(false),
});

export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createQuestionSchema = z.object({
  questionText: z.string().min(1, "Question is required"),
  optionA: z.string().min(1, "Option A is required"),
  optionB: z.string().min(1, "Option B is required"),
  optionC: z.string().optional(),
  optionD: z.string().optional(),
  correctAnswer: z.enum(["0", "1", "2", "3"], {
    required_error: "Correct option is required",
  }),
  marks: z.coerce.number().int().positive("Marks must be > 0"),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

