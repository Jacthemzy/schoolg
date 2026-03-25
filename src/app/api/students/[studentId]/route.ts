import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { User } from "@/models/User";
import { requireRole } from "@/lib/server/auth";

export async function DELETE(
  _: Request,
  context: { params: Promise<{ studentId: string }> },
) {
  const auth = await requireRole("admin");
  if (!auth.ok) return auth.response;

  const { studentId } = await context.params;

  if (!Types.ObjectId.isValid(studentId)) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  await connectMongoose();
  await User.deleteOne({ _id: studentId, role: "student" });

  return NextResponse.json({ success: true });
}
