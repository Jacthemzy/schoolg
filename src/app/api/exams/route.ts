import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { Exam } from "@/models/Exam";
import { createExamSchema } from "@/lib/admin-schemas";
import { requireRole } from "@/lib/server/auth";

export async function GET() {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  await connectMongoose();
  const exams = await Exam.find().sort({ createdAt: -1 }).lean();

  return NextResponse.json(
    exams.map((exam) => ({
      id: String(exam._id),
      title: exam.title,
      subject: exam.subject,
      classTarget: exam.classTarget,
      readingTime: exam.readingTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      isActive: exam.isActive,
      createdAt: exam.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const payload = createExamSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectMongoose();

  const exam = await Exam.create({
    ...payload.data,
    examPassword: await bcrypt.hash(payload.data.examPassword, 10),
  });

  return NextResponse.json(
    {
      id: String(exam._id),
      title: exam.title,
      subject: exam.subject,
      classTarget: exam.classTarget,
      readingTime: exam.readingTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      isActive: exam.isActive,
      createdAt: exam.createdAt,
    },
    { status: 201 },
  );
}
