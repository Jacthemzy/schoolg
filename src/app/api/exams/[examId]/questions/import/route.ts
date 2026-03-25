import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Question } from "@/models/Question";
import { requireRole } from "@/lib/server/auth";

type ImportQuestion = {
  questionText?: string;
  options?: string[];
  correctAnswer?: number;
  marks?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  const body = await request.json();
  const rawQuestions = Array.isArray(body.questions) ? body.questions : [];

  const questions = rawQuestions
    .map((item: ImportQuestion) => {
      const questionText = String(item.questionText ?? "").trim();
      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim()).filter(Boolean)
        : [];
      const correctAnswer = Number(item.correctAnswer);
      const rawMarks = Number(item.marks ?? 1);
      const marks = Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1;

      if (
        !questionText ||
        options.length < 2 ||
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer >= options.length
      ) {
        return null;
      }

      return {
        questionText,
        options,
        correctAnswer,
        marks,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (!questions.length) {
    return NextResponse.json(
      { error: "No valid questions were found in the import payload." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const existingCount = await Question.countDocuments({ examId });

  const docs = questions.map((question, index) => ({
    ...question,
    examId,
    questionNumber: existingCount + index + 1,
  }));

  const inserted = await Question.insertMany(docs, { ordered: true });

  return NextResponse.json(
    inserted.map((question) => ({
      id: String(question._id),
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      questionNumber: question.questionNumber,
      createdAt: question.createdAt,
    })),
    { status: 201 },
  );
}
