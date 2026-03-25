import { NextResponse } from "next/server";
import { Question } from "@/models/Question";
import { Result } from "@/models/Result";
import { connectMongoose } from "@/lib/mongoose";
import { finalizeAttempt, getAttemptSession } from "@/lib/server/exam-session";
import { requireRole } from "@/lib/server/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const body = await request.json();
  const selectedOption = Number(body.selectedOption);

  const sessionState = await getAttemptSession(auth.session.user!.id!, examId);
  if (!sessionState) {
    return NextResponse.json({ error: "Exam session not found." }, { status: 404 });
  }

  if (sessionState.phase !== "exam" || !sessionState.currentQuestion) {
    return NextResponse.json(
      { error: "You cannot answer questions at this stage." },
      { status: 409 },
    );
  }

  const question = sessionState.currentQuestion;

  if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption >= question.options.length) {
    return NextResponse.json({ error: "Select a valid option." }, { status: 400 });
  }

  await connectMongoose();
  const attempt = await Result.findOne({ studentId: auth.session.user!.id!, examId });

  if (!attempt) {
    return NextResponse.json({ error: "Exam attempt not found." }, { status: 404 });
  }

  const alreadyAnswered = attempt.answers.some(
    (answer) => String(answer.questionId) === String(question._id),
  );

  if (alreadyAnswered) {
    return NextResponse.json(
      { error: "This question has already been answered." },
      { status: 409 },
    );
  }

  attempt.answers.push({
    questionId: question._id,
    selectedOption,
    isCorrect: selectedOption === question.correctAnswer,
  });
  attempt.currentQuestionNumber = question.questionNumber + 1;
  await attempt.save();

  const nextQuestion = await Question.findOne({
    examId,
    questionNumber: attempt.currentQuestionNumber,
  });

  if (!nextQuestion) {
    const finalized = await finalizeAttempt(auth.session.user!.id!, examId);
    return NextResponse.json({
      success: true,
      submitted: true,
      resultId: finalized ? String(finalized._id) : null,
    });
  }

  return NextResponse.json({ success: true, submitted: false });
}
