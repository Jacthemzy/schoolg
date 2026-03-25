import { NextResponse } from "next/server";
import { finalizeAttempt } from "@/lib/server/exam-session";
import { requireRole } from "@/lib/server/auth";

export async function POST(
  _: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;
  const attempt = await finalizeAttempt(auth.session.user!.id!, examId);

  if (!attempt) {
    return NextResponse.json({ error: "Exam attempt not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    resultId: String(attempt._id),
  });
}
