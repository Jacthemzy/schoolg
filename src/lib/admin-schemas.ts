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

export type CreateExamFormValues = z.input<typeof createExamSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;

export const createQuestionSchema = z
  .object({
    questionType: z.enum(["text", "image"]).default("text"),
    answerType: z.enum(["objective", "theory"]).default("objective"),
    questionText: z.string().default(""),
    questionImageUrl: z.string().trim().optional().or(z.literal("")),
    optionA: z.string().default(""),
    optionB: z.string().default(""),
    optionC: z.string().optional(),
    optionD: z.string().optional(),
    optionE: z.string().optional(),
    correctAnswer: z.enum(["0", "1", "2", "3", "4"]).optional(),
    theoryKeywords: z.string().default(""),
    theorySampleAnswer: z.string().default(""),
    marks: z.coerce.number().int().positive("Marks must be > 0"),
  })
  .superRefine((value, ctx) => {
    const hasQuestionText = value.questionText.trim().length > 0;
    const hasQuestionImage = String(value.questionImageUrl ?? "").trim().length > 0;

    if (!hasQuestionText && !hasQuestionImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add question text or upload a question image.",
        path: ["questionText"],
      });
    }

    if (value.answerType === "objective") {
      const optionCount = [
        value.optionA,
        value.optionB,
        value.optionC,
        value.optionD,
        value.optionE,
      ].filter((option) => String(option ?? "").trim()).length;

      if (!String(value.optionA ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Option A is required for objective questions.",
          path: ["optionA"],
        });
      }

      if (!String(value.optionB ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Option B is required for objective questions.",
          path: ["optionB"],
        });
      }

      if (!value.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Correct option is required.",
          path: ["correctAnswer"],
        });
      } else if (Number(value.correctAnswer) >= optionCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Correct option must match one of the filled options.",
          path: ["correctAnswer"],
        });
      }
    }

    if (value.answerType === "theory") {
      const keywords = value.theoryKeywords
        .split(/[\n,]+/)
        .map((keyword) => keyword.trim())
        .filter(Boolean);

      if (!keywords.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Add at least one theory keyword for auto-marking.",
          path: ["theoryKeywords"],
        });
      }
    }
  });

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type CreateQuestionFormValues = z.input<typeof createQuestionSchema>;

