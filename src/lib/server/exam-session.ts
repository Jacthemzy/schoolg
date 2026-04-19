import bcrypt from "bcrypt";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Exam } from "@/models/Exam";
import { Question, type IQuestion } from "@/models/Question";
import { Result } from "@/models/Result";
import { User } from "@/models/User";

const EXAM_RECOVERY_GRACE_PERIOD_MS = 5 * 60_000;

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function scoreTheoryAnswer(
  question: Pick<IQuestion, "marks" | "theoryKeywords">,
  answerText: string,
) {
  const normalizedAnswer = normalizeKeyword(answerText);
  const expectedKeywords = question.theoryKeywords
    .map((keyword) => normalizeKeyword(keyword))
    .filter(Boolean);
  const matchedKeywords = expectedKeywords.filter((keyword) => {
    if (!keyword) return false;
    return normalizedAnswer.includes(keyword);
  });
  const uniqueExpected = [...new Set(expectedKeywords)];
  const uniqueMatched = [...new Set(matchedKeywords)];
  const ratio = uniqueExpected.length ? uniqueMatched.length / uniqueExpected.length : 0;
  const scoreAwarded = Math.round(question.marks * ratio * 100) / 100;

  return {
    isCorrect: uniqueExpected.length > 0 && uniqueMatched.length === uniqueExpected.length,
    scoreAwarded,
    matchedKeywords: uniqueMatched,
    expectedKeywords: uniqueExpected,
  };
}

export function scoreQuestionAnswer(
  question: Pick<IQuestion, "answerType" | "correctAnswer" | "marks" | "theoryKeywords">,
  payload: { selectedOption?: number; answerText?: string },
) {
  if (question.answerType === "theory") {
    return scoreTheoryAnswer(question, payload.answerText ?? "");
  }

  const isCorrect = payload.selectedOption === question.correctAnswer;
  return {
    isCorrect,
    scoreAwarded: isCorrect ? question.marks : 0,
    matchedKeywords: [],
    expectedKeywords: [],
  };
}

export async function getStudentBySessionId(studentId: string) {
  await connectMongoose();
  return User.findById(studentId);
}

export async function getExamForStudent(examId: string, className?: string) {
  await connectMongoose();

  if (!Types.ObjectId.isValid(examId)) {
    return null;
  }

  return Exam.findOne({
    _id: examId,
    isActive: true,
    ...(className ? { classTarget: className } : {}),
  });
}

export async function getQuestionsForExam(examId: string) {
  await connectMongoose();
  return Question.find({ examId }).sort({ questionNumber: 1 });
}

export async function getAttempt(studentId: string, examId: string) {
  await connectMongoose();
  return Result.findOne({ studentId, examId });
}

export async function canStartExam(examId: string, className?: string) {
  const exam = await getExamForStudent(examId, className);

  if (!exam) {
    return { ok: false as const, error: "Exam not found or not available." };
  }

  const questions = await getQuestionsForExam(examId);

  if (questions.length === 0) {
    return { ok: false as const, error: "This exam has no questions yet." };
  }

  return { ok: true as const, exam, questions };
}

export async function validateExamPassword(
  hashedPassword: string,
  plainPassword: string,
) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function createAttempt(studentId: string, examId: string) {
  await connectMongoose();
  const exam = await Exam.findById(examId);

  if (!exam) {
    throw new Error("Exam not found");
  }

  const now = new Date();
  const readingEndsAt = new Date(now.getTime() + exam.readingTime * 60_000);
  const examEndsAt = new Date(readingEndsAt.getTime() + exam.duration * 60_000);

  return Result.create({
    studentId,
    examId,
    score: 0,
    totalMarks: exam.totalMarks,
    answers: [],
    status: "in_progress",
    readingEndsAt,
    examEndsAt,
    currentQuestionNumber: 1,
  });
}

export async function finalizeAttempt(studentId: string, examId: string) {
  await connectMongoose();
  const [attempt, questions, exam] = await Promise.all([
    Result.findOne({ studentId, examId }),
    Question.find({ examId }).sort({ questionNumber: 1 }),
    Exam.findById(examId),
  ]);

  if (!attempt || !exam) {
    return null;
  }

  if (attempt.status === "submitted") {
    return attempt;
  }

  const answerMap = new Map(
    attempt.answers.map((answer) => [String(answer.questionId), answer]),
  );

  const score = questions.reduce((total, question) => {
    const record = answerMap.get(String(question._id));
    if (!record) {
      return total;
    }

    const scored = scoreQuestionAnswer(question, {
      selectedOption: record.selectedOption,
      answerText: record.answerText,
    });
    record.isCorrect = scored.isCorrect;
    record.scoreAwarded = scored.scoreAwarded;
    record.matchedKeywords = scored.matchedKeywords;
    record.expectedKeywords = scored.expectedKeywords;
    return total + scored.scoreAwarded;
  }, 0);

  attempt.score = score;
  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  attempt.currentQuestionNumber = questions.length + 1;
  attempt.totalMarks = exam.totalMarks;
  await attempt.save();

  return attempt;
}

export async function getAttemptSession(studentId: string, examId: string) {
  await connectMongoose();
  const [attempt, exam, questions] = await Promise.all([
    Result.findOne({ studentId, examId }).lean(),
    Exam.findById(examId).lean(),
    Question.find({ examId }).sort({ questionNumber: 1 }).lean(),
  ]);

  if (!attempt || !exam) {
    return null;
  }

  const now = Date.now();
  const readingEndsAt = attempt.readingEndsAt
    ? new Date(attempt.readingEndsAt).getTime()
    : null;
  const examEndsAt = attempt.examEndsAt ? new Date(attempt.examEndsAt).getTime() : null;
  const graceEndsAt = examEndsAt ? examEndsAt + EXAM_RECOVERY_GRACE_PERIOD_MS : null;

  if (attempt.status !== "submitted" && graceEndsAt && now >= graceEndsAt) {
    const finalized = await finalizeAttempt(studentId, examId);
    if (!finalized) return null;
    return getAttemptSession(studentId, examId);
  }

  const phase =
    attempt.status === "submitted"
      ? "submitted"
      : readingEndsAt && now < readingEndsAt
        ? "reading"
        : "exam";

  const currentQuestion =
    attempt.status === "submitted"
      ? null
      : questions.find(
          (question) => question.questionNumber === attempt.currentQuestionNumber,
        ) ?? null;

  if (
    attempt.status !== "submitted" &&
    phase === "exam" &&
    !currentQuestion
  ) {
    const finalized = await finalizeAttempt(studentId, examId);
    if (!finalized) return null;
    return getAttemptSession(studentId, examId);
  }

  return {
    attempt,
    exam,
    questionsCount: questions.length,
    phase,
      currentQuestion,
      graceEndsAt,
  };
}
