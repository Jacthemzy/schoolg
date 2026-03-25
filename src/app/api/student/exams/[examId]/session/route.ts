import { NextResponse } from "next/server";
import { requireRole } from "@/lib/server/auth";
import { getAttemptSession } from "@/lib/server/exam-session";

export async function GET(
  _: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const sessionState = await getAttemptSession(auth.session.user!.id!, examId);

  if (!sessionState) {
    return NextResponse.json(
      { error: "Exam session not found." },
      { status: 404 },
    );
  }

  const { attempt, exam, phase, currentQuestion, questionsCount } = sessionState;

  return NextResponse.json({
    exam: {
      id: String(exam._id),
      title: exam.title,
      description: exam.description ?? "",
      subject: exam.subject,
      classTarget: exam.classTarget,
      readingTime: exam.readingTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
    },
    attempt: {
      id: String(attempt._id),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      status: attempt.status,
      currentQuestionNumber: attempt.currentQuestionNumber,
      submittedAt: attempt.submittedAt,
      readingEndsAt: attempt.readingEndsAt,
      examEndsAt: attempt.examEndsAt,
      answersCount: attempt.answers.length,
    },
    phase,
    questionsCount,
    currentQuestion: currentQuestion
      ? {
          id: String(currentQuestion._id),
          questionText: currentQuestion.questionText,
          options: currentQuestion.options,
          marks: currentQuestion.marks,
          questionNumber: currentQuestion.questionNumber,
        }
      : null,
  });
}
