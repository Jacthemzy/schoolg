import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Question } from "@/models/Question";
import { requireRole } from "@/lib/server/auth";

export async function GET(
  _: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  await connectMongoose();
  const questions = await Question.find({ examId }).sort({ questionNumber: 1 }).lean();

  return NextResponse.json(
    questions.map((question) => ({
      id: String(question._id),
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      questionNumber: question.questionNumber,
      createdAt: question.createdAt,
    })),
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const body = await request.json();

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  const options = Array.isArray(body.options)
    ? body.options.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];

  if (!body.questionText || options.length < 2) {
    return NextResponse.json(
      { error: "Question text and at least two options are required." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const existingCount = await Question.countDocuments({ examId });

  const question = await Question.create({
    examId,
    questionText: String(body.questionText).trim(),
    options,
    correctAnswer: Number(body.correctAnswer),
    marks: Number(body.marks ?? 1),
    questionNumber: existingCount + 1,
  });

  return NextResponse.json(
    {
      id: String(question._id),
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      questionNumber: question.questionNumber,
      createdAt: question.createdAt,
    },
    { status: 201 },
  );
}



