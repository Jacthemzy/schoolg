export type ExamPhase = "reading" | "exam" | "submitted";
export type ExamAttemptStatus = "in_progress" | "submitted";

export type ExamSessionPayload = {
  exam: {
    id: string;
    title: string;
    description: string;
    subject: string;
    classTarget: string;
    readingTime: number;
    duration: number;
    totalMarks: number;
  };
  attempt: {
    id: string;
    score: number;
    totalMarks: number;
    status: ExamAttemptStatus;
    currentQuestionNumber: number;
    submittedAt?: string;
    readingEndsAt?: string;
    examEndsAt?: string;
    answersCount: number;
  };
  phase: ExamPhase;
  questionsCount: number;
  currentQuestion: null | {
    id: string;
    questionType: "text" | "image";
    answerType: "objective" | "theory";
    questionText: string;
    questionImageUrl?: string;
    options: string[];
    marks: number;
    questionNumber: number;
  };
};

export function isExamPhase(value: string): value is ExamPhase {
  return value === "reading" || value === "exam" || value === "submitted";
}

export function getValidExamPhase(value: string | null | undefined): ExamPhase {
  return value && isExamPhase(value) ? value : "exam";
}

function toOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function toFiniteNumber(value: unknown, fallback = 0) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toPositiveInteger(value: unknown, fallback = 1) {
  const normalized = Math.floor(toFiniteNumber(value, fallback));
  return normalized > 0 ? normalized : fallback;
}

function getAttemptStatus(value: unknown): ExamAttemptStatus {
  return value === "submitted" ? "submitted" : "in_progress";
}

function toStringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function getQuestionType(value: unknown): "text" | "image" {
  return value === "image" ? "image" : "text";
}

function getAnswerType(value: unknown): "objective" | "theory" {
  return value === "theory" ? "theory" : "objective";
}

export function normalizeExamSessionPayload(
  payload: ExamSessionPayload | Record<string, unknown>,
): ExamSessionPayload {
  const source = payload as Record<string, unknown>;
  const exam = (source.exam ?? {}) as Record<string, unknown>;
  const attempt = (source.attempt ?? {}) as Record<string, unknown>;
  const currentQuestion =
    source.currentQuestion && typeof source.currentQuestion === "object"
      ? (source.currentQuestion as Record<string, unknown>)
      : null;

  return {
    exam: {
      id: String(exam.id ?? ""),
      title: String(exam.title ?? ""),
      description: String(exam.description ?? ""),
      subject: String(exam.subject ?? ""),
      classTarget: String(exam.classTarget ?? ""),
      readingTime: Number(exam.readingTime ?? 0),
      duration: Number(exam.duration ?? 0),
      totalMarks: Number(exam.totalMarks ?? 0),
    },
    attempt: {
      id: String(attempt.id ?? ""),
      score: toFiniteNumber(attempt.score),
      totalMarks: toFiniteNumber(attempt.totalMarks),
      status: getAttemptStatus(attempt.status),
      currentQuestionNumber: toPositiveInteger(attempt.currentQuestionNumber, 1),
      submittedAt: toOptionalString(attempt.submittedAt),
      readingEndsAt: toOptionalString(attempt.readingEndsAt),
      examEndsAt: toOptionalString(attempt.examEndsAt),
      answersCount: Math.max(0, toPositiveInteger(attempt.answersCount, 0)),
    },
    phase: getValidExamPhase(
      typeof source.phase === "string" ? source.phase : undefined,
    ),
    questionsCount: Math.max(0, toPositiveInteger(source.questionsCount, 0)),
    currentQuestion: currentQuestion
      ? {
          id: String(currentQuestion.id ?? ""),
          questionType: getQuestionType(currentQuestion.questionType),
          answerType: getAnswerType(currentQuestion.answerType),
          questionText: String(currentQuestion.questionText ?? ""),
          questionImageUrl: toOptionalString(currentQuestion.questionImageUrl),
          options: toStringArray(currentQuestion.options),
          marks: Math.max(0, toFiniteNumber(currentQuestion.marks)),
          questionNumber: toPositiveInteger(currentQuestion.questionNumber, 1),
        }
      : null,
  };
}
