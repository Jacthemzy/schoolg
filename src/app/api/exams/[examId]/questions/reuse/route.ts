import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { requireRole } from "@/lib/server/auth";
import { Exam } from "@/models/Exam";
import { Question } from "@/models/Question";
import { Result } from "@/models/Result";

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const sourceExamId = String(body.sourceExamId ?? "").trim();
  const replaceExisting = Boolean(body.replaceExisting);

  if (!Types.ObjectId.isValid(examId) || !Types.ObjectId.isValid(sourceExamId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  if (examId === sourceExamId) {
    return NextResponse.json(
      { error: "Choose a different exam to reuse questions from." },
      { status: 400 },
    );
  }

  await connectMongoose();

  const [targetExam, sourceExam, sourceQuestions] = await Promise.all([
    Exam.findById(examId).lean(),
    Exam.findById(sourceExamId).lean(),
    Question.find({ examId: sourceExamId }).sort({ questionNumber: 1 }).lean(),
  ]);

  if (!targetExam || !sourceExam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  if (!sourceQuestions.length) {
    return NextResponse.json(
      { error: "The selected source exam has no questions yet." },
      { status: 400 },
    );
  }

  let startingQuestionNumber = 1;

  if (replaceExisting) {
    await Promise.all([
      Question.deleteMany({ examId }),
      Result.deleteMany({ examId }),
    ]);
  } else {
    startingQuestionNumber = (await Question.countDocuments({ examId })) + 1;
  }

  const clonedQuestions = sourceQuestions.map((question, index) => ({
    examId,
    questionType: question.questionType,
    answerType: question.answerType,
    questionText: question.questionText,
    questionImageUrl: question.questionImageUrl,
    options: question.options,
    correctAnswer: question.correctAnswer,
    theoryKeywords: question.theoryKeywords,
    theorySampleAnswer: question.theorySampleAnswer,
    marks: question.marks,
    questionNumber: startingQuestionNumber + index,
  }));

  await Question.insertMany(clonedQuestions);

  return NextResponse.json({
    success: true,
    importedCount: clonedQuestions.length,
    clearedExisting: replaceExisting,
  });
}
