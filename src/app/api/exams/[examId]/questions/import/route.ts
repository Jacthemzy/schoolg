import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Question } from "@/models/Question";
import { requireRole } from "@/lib/server/auth";

type ImportQuestion = {
  questionType?: string;
  answerType?: string;
  questionText?: string;
  questionImageUrl?: string;
  options?: string[];
  correctAnswer?: number;
  theoryKeywords?: string[];
  theorySampleAnswer?: string;
  marks?: number;
};

type NormalizedQuestion = {
  questionType: "text" | "image";
  answerType: "objective" | "theory";
  questionText: string;
  questionImageUrl?: string;
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  theorySampleAnswer?: string;
  marks: number;
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
      const questionImageUrl = String(item.questionImageUrl ?? "").trim();
      const answerType = item.answerType === "theory" ? "theory" : "objective";
      const options = Array.isArray(item.options)
        ? item.options.map((option) => String(option).trim()).filter(Boolean)
        : [];
      const correctAnswer =
        item.correctAnswer === undefined || item.correctAnswer === null
          ? undefined
          : Number(item.correctAnswer);
      const theoryKeywords = Array.isArray(item.theoryKeywords)
        ? item.theoryKeywords.map((keyword) => String(keyword).trim()).filter(Boolean)
        : [];
      const theorySampleAnswer = String(item.theorySampleAnswer ?? "").trim();
      const rawMarks = Number(item.marks ?? 1);
      const marks = Number.isFinite(rawMarks) && rawMarks > 0 ? rawMarks : 1;
      const questionType = questionImageUrl ? "image" : "text";

      const hasValidCorrectAnswer =
        typeof correctAnswer === "number" &&
        Number.isInteger(correctAnswer) &&
        correctAnswer >= 0 &&
        correctAnswer < options.length;

      if (
        (!questionText && !questionImageUrl) ||
        (answerType === "objective" && (options.length < 2 || !hasValidCorrectAnswer)) ||
        (answerType === "theory" && theoryKeywords.length === 0)
      ) {
        return null;
      }

      return {
        questionType,
        answerType,
        questionText,
        questionImageUrl: questionImageUrl || undefined,
        options: answerType === "objective" ? options : [],
        correctAnswer: answerType === "objective" ? correctAnswer : undefined,
        theoryKeywords: answerType === "theory" ? theoryKeywords : [],
        theorySampleAnswer: answerType === "theory" ? theorySampleAnswer || undefined : undefined,
        marks,
      };
    })
    .filter((item: NormalizedQuestion | null): item is NormalizedQuestion => Boolean(item));

  if (!questions.length) {
    return NextResponse.json(
      { error: "No valid questions were found in the import payload." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const existingCount = await Question.countDocuments({ examId });

  const docs = questions.map((question: NormalizedQuestion, index: number) => ({
    ...question,
    examId,
    questionNumber: existingCount + index + 1,
  }));

  const inserted = await Question.insertMany(docs, { ordered: true });

  return NextResponse.json(
    inserted.map((question) => ({
      id: String(question._id),
      questionType: question.questionType,
      answerType: question.answerType,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
      options: question.options,
      correctAnswer: question.correctAnswer,
      theoryKeywords: question.theoryKeywords,
      theorySampleAnswer: question.theorySampleAnswer,
      marks: question.marks,
      questionNumber: question.questionNumber,
      createdAt: question.createdAt,
    })),
    { status: 201 },
  );
}
