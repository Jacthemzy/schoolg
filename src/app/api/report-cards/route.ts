import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import {
  buildReportCardView,
  normalizeReportSubject,
  type ReportCardRow,
} from "@/lib/report-card";
import { requireSession, requireRole } from "@/lib/server/auth";
import { ReportCard } from "@/models/ReportCard";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  await connectMongoose();

  const searchParams = request.nextUrl.searchParams;
  const studentId = searchParams.get("studentId")?.trim();
  const className = searchParams.get("className")?.trim();
  const term = searchParams.get("term")?.trim();
  const sessionLabel = searchParams.get("sessionLabel")?.trim();
  const prefill = searchParams.get("prefill");

  if (prefill === "results") {
    if (auth.session.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!studentId || !Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Valid student id is required." }, { status: 400 });
    }

    const results = await Result.find({ studentId, status: "submitted" }).lean();
    const examIds = [...new Set(results.map((item) => String(item.examId)))];
    const exams = await Exam.find({ _id: { $in: examIds } }).lean();
    const examMap = new Map(exams.map((exam) => [String(exam._id), exam]));

    const subjectMap = new Map<string, ReturnType<typeof normalizeReportSubject>>();

    for (const result of results) {
      const exam = examMap.get(String(result.examId));
      if (!exam?.subject) continue;

      const total = result.totalMarks
        ? Math.round((result.score / result.totalMarks) * 100 * 100) / 100
        : 0;

      subjectMap.set(
        exam.subject.toLowerCase(),
        normalizeReportSubject({
          subject: exam.subject,
          classWork: 0,
          examScore: total,
          total,
        }),
      );
    }

    const subjects = Array.from(subjectMap.values()).filter(
      (item: ReportCardRow | null): item is ReportCardRow => Boolean(item),
    );

    return NextResponse.json(subjects);
  }

  const filter: Record<string, unknown> = {};

  if (auth.session.user?.role === "student") {
    filter.studentId = auth.session.user.id;
  } else {
    if (studentId && Types.ObjectId.isValid(studentId)) {
      filter.studentId = studentId;
    }
    if (className) {
      filter.className = className;
    }
  }

  if (term) filter.term = term;
  if (sessionLabel) filter.sessionLabel = sessionLabel;

  const reportCards = await ReportCard.find(filter).sort({ updatedAt: -1 }).lean();

  return NextResponse.json(reportCards.map((card) => buildReportCardView(card)));
}

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const studentId = String(body.studentId ?? "").trim();
  const className = String(body.className ?? "").trim();
  const term = String(body.term ?? "").trim();
  const sessionLabel = String(body.sessionLabel ?? "").trim();
  const attendanceDaysValue = String(body.attendanceDays ?? "").trim();
  const attendanceDays = attendanceDaysValue ? Number(attendanceDaysValue) : undefined;
  const gender = String(body.gender ?? "").trim();
  const teacherName = String(body.teacherName ?? "").trim();
  const resumptionDate = String(body.resumptionDate ?? "").trim();

  if (!Types.ObjectId.isValid(studentId) || !className || !term || !sessionLabel) {
    return NextResponse.json(
      { error: "Student, class, term, and session are required." },
      { status: 400 },
    );
  }

  const subjects = Array.isArray(body.subjects)
    ? body.subjects
        .map((item: unknown) =>
          normalizeReportSubject((item ?? {}) as Record<string, unknown>),
        )
        .filter((item: ReportCardRow | null): item is ReportCardRow => Boolean(item))
    : [];

  if (subjects.length === 0) {
    return NextResponse.json(
      { error: "Add at least one subject before saving the report card." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const student = await User.findById(studentId).lean();

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const average =
    Math.round(
      (
        subjects.reduce((sum: number, item: ReportCardRow) => sum + item.total, 0) /
        subjects.length
      ) * 100,
    ) / 100;

  const reportCard = await ReportCard.findOneAndUpdate(
    { studentId, className, term, sessionLabel },
    {
      studentId,
      studentName: student.fullName,
      studentDmsNumber: student.dmsNumber ?? "",
      className,
      term,
      sessionLabel,
      gender: gender || undefined,
      attendanceDays: Number.isFinite(attendanceDays) ? attendanceDays : undefined,
      nextTermBegins: String(body.nextTermBegins ?? "").trim() || undefined,
      resumptionDate: resumptionDate || undefined,
      teacherName: teacherName || undefined,
      subjects,
      average,
      teacherComment: String(body.teacherComment ?? "").trim() || undefined,
      principalComment: String(body.principalComment ?? "").trim() || undefined,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  ).lean();

  if (!reportCard) {
    return NextResponse.json(
      { error: "Could not save the report card." },
      { status: 500 },
    );
  }

  return NextResponse.json(buildReportCardView(reportCard), { status: 201 });
}
