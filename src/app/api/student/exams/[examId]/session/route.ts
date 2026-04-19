import { NextResponse } from "next/server";
import { getValidExamPhase } from "@/lib/exam-session-payload";
import { requireRole } from "@/lib/server/auth";
import { getAttemptSession } from "@/lib/server/exam-session";

export async function GET(
  _: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const studentId = auth.session.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sessionState = await getAttemptSession(studentId, examId);

  if (!sessionState) {
    return NextResponse.json(
      { error: "Exam session not found." },
      { status: 404 },
    );
  }

  const { attempt, exam, phase, currentQuestion, questionsCount, graceEndsAt } = sessionState;

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
      submittedAt: attempt.submittedAt?.toISOString(),
      readingEndsAt: attempt.readingEndsAt?.toISOString(),
      examEndsAt: attempt.examEndsAt?.toISOString(),
      graceEndsAt: graceEndsAt ? new Date(graceEndsAt).toISOString() : undefined,
      answersCount: attempt.answers.length,
    },
    phase: getValidExamPhase(phase),
    questionsCount,
    currentQuestion: currentQuestion
      ? {
          id: String(currentQuestion._id),
          questionType: currentQuestion.questionType,
          answerType: currentQuestion.answerType,
          questionText: currentQuestion.questionText,
          questionImageUrl: currentQuestion.questionImageUrl,
          options: currentQuestion.options,
          marks: currentQuestion.marks,
          questionNumber: currentQuestion.questionNumber,
        }
      : null,
  });
}
