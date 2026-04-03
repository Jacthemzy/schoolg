import { NextResponse } from "next/server";
import {
  canStartExam,
  createAttempt,
  getAttempt,
  validateExamPassword,
} from "@/lib/server/exam-session";
import { requireRole } from "@/lib/server/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const password = String(body.examPassword ?? "");
  const className = auth.session.user?.className;
  const studentId = auth.session.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const examState = await canStartExam(examId, className);
  if (!examState.ok) {
    return NextResponse.json({ error: examState.error }, { status: 404 });
  }

  const matches = await validateExamPassword(examState.exam.examPassword, password);
  if (!matches) {
    return NextResponse.json({ error: "Invalid exam password." }, { status: 401 });
  }

  const existingAttempt = await getAttempt(studentId, examId);

  if (existingAttempt?.status === "submitted") {
    return NextResponse.json(
      { error: "You have already submitted this exam." },
      { status: 409 },
    );
  }

  const attempt = existingAttempt ?? (await createAttempt(studentId, examId));

  return NextResponse.json({
    success: true,
    attemptId: String(attempt._id),
    redirectTo: `/exam/${examId}`,
  });
}
