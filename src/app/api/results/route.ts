import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Result } from "@/models/Result";
import { User } from "@/models/User";
import { Exam } from "@/models/Exam";
import { requireSession } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const role = auth.session.user?.role;

  await connectMongoose();

  const searchParams = request.nextUrl.searchParams;
  const examId = searchParams.get("examId")?.trim();
  const className = searchParams.get("className")?.trim();

  const filter: Record<string, unknown> = {};

  if (role === "student") {
    filter.studentId = auth.session.user?.id;
  }

  if (role === "admin" && examId) {
    filter.examId = examId;
  }

  const results = await Result.find(filter).sort({ createdAt: -1 }).lean();
  const studentIds = [...new Set(results.map((result) => String(result.studentId)))];
  const examIds = [...new Set(results.map((result) => String(result.examId)))];

  const [students, exams] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).lean(),
    Exam.find({ _id: { $in: examIds } }).lean(),
  ]);

  const studentMap = new Map(students.map((student) => [String(student._id), student]));
  const examMap = new Map(exams.map((exam) => [String(exam._id), exam]));

  const payload = results
    .map((result) => {
      const student = studentMap.get(String(result.studentId));
      const exam = examMap.get(String(result.examId));

      return {
        id: String(result._id),
        studentId: String(result.studentId),
        studentName: student?.fullName ?? "Unknown student",
        dmsNumber: student?.dmsNumber ?? "",
        className: student?.className ?? "",
        examId: String(result.examId),
        examTitle: exam?.title ?? "Unknown exam",
        subject: exam?.subject ?? "",
        score: result.score,
        totalMarks: result.totalMarks,
        status: result.status,
        submittedAt: result.submittedAt,
        createdAt: result.createdAt,
      };
    })
    .filter((item) => (className ? item.className === className : true));

  return NextResponse.json(payload);
}
