import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Question } from "@/models/Question";
import { requireRole } from "@/lib/server/auth";

function normalizePayload(body: Record<string, unknown>) {
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

  return {
    options,
    answerType,
    correctAnswer,
    theoryKeywords,
    theorySampleAnswer,
    questionText,
    questionImageUrl,
    questionType,
    marks,
  };
}

function validateQuestion(body: ReturnType<typeof normalizePayload>) {
  if (!body.questionText && !body.questionImageUrl) {
    return "Question text or image is required.";
  }

  if (body.answerType === "objective" && body.options.length < 2) {
    return "Objective questions need at least two options.";
  }

  if (
    body.answerType === "objective" &&
    (
      body.correctAnswer === undefined ||
      !Number.isInteger(body.correctAnswer) ||
      body.correctAnswer < 0 ||
      body.correctAnswer >= body.options.length
    )
  ) {
    return "Correct answer must point to a valid option.";
  }

  if (body.answerType === "theory" && body.theoryKeywords.length === 0) {
    return "Theory questions need at least one keyword for auto-marking.";
  }

  if (!Number.isFinite(body.marks) || body.marks <= 0) {
    return "Marks must be greater than zero.";
  }

  return null;
}

function serializeQuestion(question: {
  _id: { toString(): string };
  questionType: "text" | "image";
  answerType: "objective" | "theory";
  questionText: string;
  questionImageUrl?: string;
  options: string[];
  correctAnswer?: number;
  theoryKeywords: string[];
  theorySampleAnswer?: string;
  marks: number;
  questionNumber: number;
  createdAt: Date;
}) {
  return {
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
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ examId: string; questionId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId, questionId } = await context.params;
  if (!Types.ObjectId.isValid(examId) || !Types.ObjectId.isValid(questionId)) {
    return NextResponse.json({ error: "Invalid question or exam id." }, { status: 400 });
  }

  const body = normalizePayload(
    (await request.json().catch(() => ({}))) as Record<string, unknown>,
  );
  const validationError = validateQuestion(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  await connectMongoose();
  const question = await Question.findOneAndUpdate(
    { _id: questionId, examId },
    {
      questionType: body.questionType,
      answerType: body.answerType,
      questionText: body.questionText,
      questionImageUrl: body.questionImageUrl || undefined,
      options: body.answerType === "objective" ? body.options : [],
      correctAnswer: body.answerType === "objective" ? body.correctAnswer : undefined,
      theoryKeywords: body.answerType === "theory" ? body.theoryKeywords : [],
      theorySampleAnswer:
        body.answerType === "theory" ? body.theorySampleAnswer || undefined : undefined,
      marks: body.marks,
    },
    { new: true },
  ).lean();

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  return NextResponse.json(serializeQuestion(question));
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ examId: string; questionId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId, questionId } = await context.params;
  if (!Types.ObjectId.isValid(examId) || !Types.ObjectId.isValid(questionId)) {
    return NextResponse.json({ error: "Invalid question or exam id." }, { status: 400 });
  }

  await connectMongoose();
  const question = await Question.findOneAndDelete({ _id: questionId, examId }).lean();

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  const remainingQuestions = await Question.find({ examId }).sort({ questionNumber: 1 });
  await Promise.all(
    remainingQuestions.map((item, index) => {
      item.questionNumber = index + 1;
      return item.save();
    }),
  );

  return NextResponse.json({ success: true });
}
