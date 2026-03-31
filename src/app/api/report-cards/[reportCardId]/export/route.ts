import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import {
  renderReportCardPdf,
  renderReportCardRaster,
  renderReportCardSvg,
} from "@/lib/report-card-export";
import { buildReportCardView } from "@/lib/report-card";
import { requireSession } from "@/lib/server/auth";
import { ReportCard } from "@/models/ReportCard";

export async function GET(
  request: NextRequest,
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

  const format = request.nextUrl.searchParams.get("format")?.trim().toLowerCase() ?? "pdf";
  const view = buildReportCardView(reportCard);
  const safeName = `${view.studentName}-${view.term}-${view.sessionLabel}`
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  if (format === "svg") {
    return new NextResponse(renderReportCardSvg(view), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${safeName}.svg"`,
      },
    });
  }

  if (format === "png" || format === "jpeg" || format === "jpg") {
    const normalizedFormat = format === "jpg" ? "jpeg" : format;
    const buffer = await renderReportCardRaster(view, normalizedFormat);

    return new NextResponse(new Blob([new Uint8Array(buffer)]), {
      headers: {
        "Content-Type": normalizedFormat === "png" ? "image/png" : "image/jpeg",
        "Content-Disposition": `attachment; filename="${safeName}.${normalizedFormat}"`,
      },
    });
  }

  const pdf = await renderReportCardPdf(view);
  return new NextResponse(new Blob([new Uint8Array(pdf)]), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}.pdf"`,
    },
  });
}
