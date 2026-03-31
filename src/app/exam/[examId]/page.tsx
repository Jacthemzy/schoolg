import { redirect } from "next/navigation";
import {
  ExamSessionClient,
  type ExamPhase,
  type ExamSessionPayload,
} from "@/components/student/exam-session-client";
import { StartExamClient } from "@/components/student/start-exam-client";
import { getAppSession } from "@/lib/server/auth";
import { getAttemptSession, getExamForStudent } from "@/lib/server/exam-session";

function isExamPhase(value: string): value is ExamPhase {
  return value === "reading" || value === "exam" || value === "submitted";
}

function getValidatedPhase(value: string): ExamPhase {
  return isExamPhase(value) ? value : "submitted";
}

function getInitialTimeLeft(phase: ExamPhase, attempt: {
  readingEndsAt?: Date;
  examEndsAt?: Date;
}) {
  const target =
    phase === "reading"
      ? attempt.readingEndsAt
      : phase === "exam"
        ? attempt.examEndsAt
        : null;

  if (!target) {
    return 0;
  }

  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
}

export default async function ExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const session = await getAppSession();

  if (!session?.user?.id || session.user.role !== "student") {
    redirect("/");
  }

  const { examId } = await params;
  const sessionState = await getAttemptSession(session.user.id, examId);

  if (!sessionState) {
    const exam = await getExamForStudent(examId, session.user.className);

    if (!exam) {
      redirect("/dashboard");
    }

    return (
      <StartExamClient
        examId={examId}
        exam={{
          title: exam.title,
          description: exam.description ?? "",
          subject: exam.subject,
          classTarget: exam.classTarget,
          readingTime: exam.readingTime,
          duration: exam.duration,
          totalMarks: exam.totalMarks,
        }}
      />
    );
  }

  const phase = getValidatedPhase(sessionState.phase);

  const initialData: ExamSessionPayload = {
    exam: {
      id: String(sessionState.exam._id),
      title: sessionState.exam.title,
      description: sessionState.exam.description ?? "",
      subject: sessionState.exam.subject,
      classTarget: sessionState.exam.classTarget,
      readingTime: sessionState.exam.readingTime,
      duration: sessionState.exam.duration,
      totalMarks: sessionState.exam.totalMarks,
    },
    attempt: {
      id: String(sessionState.attempt._id),
      score: sessionState.attempt.score,
      totalMarks: sessionState.attempt.totalMarks,
      status: sessionState.attempt.status,
      currentQuestionNumber: sessionState.attempt.currentQuestionNumber ?? 1,
      submittedAt: sessionState.attempt.submittedAt?.toISOString(),
      readingEndsAt: sessionState.attempt.readingEndsAt?.toISOString(),
      examEndsAt: sessionState.attempt.examEndsAt?.toISOString(),
      answersCount: sessionState.attempt.answers.length,
    },
    phase,
    questionsCount: sessionState.questionsCount,
    currentQuestion: sessionState.currentQuestion
      ? {
          id: String(sessionState.currentQuestion._id),
          questionType: sessionState.currentQuestion.questionType,
          answerType: sessionState.currentQuestion.answerType,
          questionText: sessionState.currentQuestion.questionText,
          questionImageUrl: sessionState.currentQuestion.questionImageUrl,
          options: sessionState.currentQuestion.options,
          marks: sessionState.currentQuestion.marks,
          questionNumber: sessionState.currentQuestion.questionNumber,
        }
      : null,
  };

  return (
    <ExamSessionClient
      examId={examId}
      initialData={initialData}
      initialTimeLeft={getInitialTimeLeft(phase, sessionState.attempt)}
    />
  );
}
