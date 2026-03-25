import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { buildReportCardView } from "@/lib/report-card";
import { requireSession } from "@/lib/server/auth";
import { ReportCard } from "@/models/ReportCard";

export async function GET(
  _: Request,
  context: { params: Promise<{ reportCardId: string }> },
) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { reportCardId } = await context.params;

  if (!Types.ObjectId.isValid(reportCardId)) {
    return NextResponse.json({ error: "Invalid report card id." }, { status: 400 });
  }

  await connectMongoose();
  const reportCard = await ReportCard.findById(reportCardId).lean();

  if (!reportCard) {
    return NextResponse.json({ error: "Report card not found." }, { status: 404 });
  }

  if (
    auth.session.user?.role === "student" &&
    String(reportCard.studentId) !== auth.session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(buildReportCardView(reportCard));
}
