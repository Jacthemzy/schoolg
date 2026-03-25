import { redirect } from "next/navigation";
import { ExamSessionClient } from "@/components/student/exam-session-client";
import { StartExamClient } from "@/components/student/start-exam-client";
import { getAppSession } from "@/lib/server/auth";
import { getAttemptSession, getExamForStudent } from "@/lib/server/exam-session";

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

  const initialData = {
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
    phase: sessionState.phase,
    questionsCount: sessionState.questionsCount,
    currentQuestion: sessionState.currentQuestion
      ? {
          id: String(sessionState.currentQuestion._id),
          questionText: sessionState.currentQuestion.questionText,
          options: sessionState.currentQuestion.options,
          marks: sessionState.currentQuestion.marks,
          questionNumber: sessionState.currentQuestion.questionNumber,
        }
      : null,
  } as const;

  return <ExamSessionClient examId={examId} initialData={initialData} />;
}
