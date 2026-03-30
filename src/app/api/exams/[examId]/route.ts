import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { Exam } from "@/models/Exam";
import { requireRole } from "@/lib/server/auth";

export async function GET(
  _: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  await connectMongoose();
  const exam = await Exam.findById(examId).lean();

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: String(exam._id),
    title: exam.title,
    subject: exam.subject,
    classTarget: exam.classTarget,
    readingTime: exam.readingTime,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    isActive: exam.isActive,
    createdAt: exam.createdAt,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ examId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { examId } = await context.params;

  if (!Types.ObjectId.isValid(examId)) {
    return NextResponse.json({ error: "Invalid exam id." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const isActive =
    body && typeof body.isActive === "boolean" ? body.isActive : undefined;

  if (isActive === undefined) {
    return NextResponse.json(
      { error: "Missing or invalid isActive value." },
      { status: 400 },
    );
  }

  await connectMongoose();
  const exam = await Exam.findByIdAndUpdate(
    examId,
    { isActive },
    { new: true },
  ).lean();

  if (!exam) {
    return NextResponse.json({ error: "Exam not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: String(exam._id),
    title: exam.title,
    subject: exam.subject,
    classTarget: exam.classTarget,
    readingTime: exam.readingTime,
    duration: exam.duration,
    totalMarks: exam.totalMarks,
    isActive: exam.isActive,
    createdAt: exam.createdAt,
  });
}
