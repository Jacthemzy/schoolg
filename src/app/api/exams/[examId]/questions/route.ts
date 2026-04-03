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
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const body = await request.json().catch(() => ({}));

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  const options = Array.isArray(body.options)
    ? body.options.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const answerType = body.answerType === "theory" ? "theory" : "objective";
  const correctAnswer =
    body.correctAnswer === undefined || body.correctAnswer === null
      ? undefined
      : Number(body.correctAnswer);
  const theoryKeywords = Array.isArray(body.theoryKeywords)
    ? body.theoryKeywords.map((item: unknown) => String(item).trim()).filter(Boolean)
    : [];
  const theorySampleAnswer = String(body.theorySampleAnswer ?? "").trim();
  const questionText = String(body.questionText ?? "").trim();
  const questionImageUrl = String(body.questionImageUrl ?? "").trim();
  const questionType = questionImageUrl ? "image" : "text";
  const marks = Number(body.marks ?? 1);

  if (!questionText && !questionImageUrl) {
    return NextResponse.json(
      { error: "Question text or image is required." },
      { status: 400 },
    );
  }

  if (answerType === "objective" && options.length < 2) {
    return NextResponse.json(
      { error: "Objective questions need at least two options." },
      { status: 400 },
    );
  }

  if (
    answerType === "objective" &&
    (
      correctAnswer === undefined ||
      !Number.isInteger(correctAnswer) ||
      correctAnswer < 0 ||
      correctAnswer >= options.length
    )
  ) {
    return NextResponse.json(
      { error: "Correct answer must point to a valid option." },
      { status: 400 },
    );
  }

  if (answerType === "theory" && theoryKeywords.length === 0) {
    return NextResponse.json(
      { error: "Theory questions need at least one keyword for auto-marking." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(marks) || marks <= 0) {
    return NextResponse.json({ error: "Marks must be greater than zero." }, { status: 400 });
  }

  await connectMongoose();
  const existingCount = await Question.countDocuments({ examId });

  const question = await Question.create({
    examId,
    questionType,
    answerType,
    questionText,
    questionImageUrl: questionImageUrl || undefined,
    options: answerType === "objective" ? options : [],
    correctAnswer: answerType === "objective" ? correctAnswer : undefined,
    theoryKeywords: answerType === "theory" ? theoryKeywords : [],
    theorySampleAnswer: answerType === "theory" ? theorySampleAnswer || undefined : undefined,
    marks,
    questionNumber: existingCount + 1,
  });

  return NextResponse.json(
    {
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
    },
    { status: 201 },
  );
}
