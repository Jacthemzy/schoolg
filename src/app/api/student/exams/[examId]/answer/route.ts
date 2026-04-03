import { NextResponse } from "next/server";
import { Question } from "@/models/Question";
import { Result } from "@/models/Result";
import { connectMongoose } from "@/lib/mongoose";
import {
  finalizeAttempt,
  getAttemptSession,
  scoreQuestionAnswer,
} from "@/lib/server/exam-session";
import { requireRole } from "@/lib/server/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const studentId = auth.session.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const selectedOption =
    body.selectedOption === undefined || body.selectedOption === null
      ? undefined
      : Number(body.selectedOption);
  const answerText = String(body.answerText ?? "").trim();

  const sessionState = await getAttemptSession(studentId, examId);
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

  if (question.answerType === "objective") {
    if (
      selectedOption === undefined ||
      !Number.isInteger(selectedOption) ||
      selectedOption < 0 ||
      selectedOption >= question.options.length
    ) {
      return NextResponse.json({ error: "Select a valid option." }, { status: 400 });
    }
  } else if (!answerText) {
    return NextResponse.json(
      { error: "Enter your theory answer before moving to the next question." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const attempt = await Result.findOne({ studentId, examId });

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

  const scored = scoreQuestionAnswer(question, { selectedOption, answerText });

  attempt.answers.push({
    questionId: question._id,
    selectedOption,
    answerText: question.answerType === "theory" ? answerText : undefined,
    isCorrect: scored.isCorrect,
    scoreAwarded: scored.scoreAwarded,
    matchedKeywords: scored.matchedKeywords,
    expectedKeywords: scored.expectedKeywords,
  });
  attempt.currentQuestionNumber = question.questionNumber + 1;
  await attempt.save();

  const nextQuestion = await Question.findOne({
    examId,
    questionNumber: attempt.currentQuestionNumber,
  });

  if (!nextQuestion) {
    const finalized = await finalizeAttempt(studentId, examId);
    return NextResponse.json({
      success: true,
      submitted: true,
      resultId: finalized ? String(finalized._id) : null,
    });
  }

  return NextResponse.json({ success: true, submitted: false });
}
