import bcrypt from "bcrypt";
import { NextRequest, NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import { User } from "@/models/User";
import { requireRole } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  await connectMongoose();
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query")?.trim();
  const className = searchParams.get("className")?.trim();

  const filter: Record<string, unknown> = { role: "student" };

  if (query) {
    filter.$or = [
      { dmsNumber: { $regex: query, $options: "i" } },
      { fullName: { $regex: query, $options: "i" } },
    ];
  }

  if (className) {
    filter.className = className;
  }

  const students = await User.find(filter).sort({ createdAt: -1 }).lean();

  return NextResponse.json(
    students.map((student) => ({
      id: String(student._id),
      dmsNumber: student.dmsNumber ?? "",
      fullName: student.fullName,
      className: student.className ?? "",
      createdAt: student.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  await connectMongoose();
  const body = await request.json();

  const dmsNumber = String(body.dmsNumber ?? "").trim().toUpperCase();
  const fullName = String(body.fullName ?? "").trim();
  const className = String(body.className ?? "").trim();
  const password = String(body.password ?? "");

  if (!/^DMS\d{3,}$/.test(dmsNumber)) {
    return NextResponse.json(
      { error: "DMS Number must look like DMS001, DMS002, ..." },
      { status: 400 },
    );
  }

  if (!fullName || !className || password.length < 6) {
    return NextResponse.json(
      { error: "Full name, class, and a password of at least 6 characters are required." },
      { status: 400 },
    );
  }

  const existing = await User.findOne({ dmsNumber });
  if (existing) {
    return NextResponse.json(
      { error: "That DMS Number is already registered." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const student = await User.create({
    dmsNumber,
    fullName,
    className,
    password: hashedPassword,
    role: "student",
  });

  return NextResponse.json(
    {
      id: String(student._id),
      dmsNumber: student.dmsNumber,
      fullName: student.fullName,
      className: student.className,
    },
    { status: 201 },
  );
}
