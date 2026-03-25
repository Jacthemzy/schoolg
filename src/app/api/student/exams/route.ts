import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Exam } from "@/models/Exam";
import { Result } from "@/models/Result";
import { requireRole } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  await connectMongoose();
  const className = auth.session.user?.className;
  const studentId = auth.session.user?.id;

  const [exams, attempts] = await Promise.all([
    Exam.find({ isActive: true, classTarget: className }).sort({ createdAt: -1 }).lean(),
    Result.find({ studentId }).lean(),
  ]);

  const attemptMap = new Map(attempts.map((attempt) => [String(attempt.examId), attempt]));

  return NextResponse.json(
    exams.map((exam) => {
      const attempt = attemptMap.get(String(exam._id));
      return {
        id: String(exam._id),
        title: exam.title,
        description: exam.description ?? "",
        subject: exam.subject,
        classTarget: exam.classTarget,
        readingTime: exam.readingTime,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        status: attempt?.status === "submitted" ? "Completed" : attempt ? "Continue" : "Not Started",
      };
    }),
  );
}
