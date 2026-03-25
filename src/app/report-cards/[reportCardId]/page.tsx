import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { buildReportCardView } from "@/lib/report-card";
import { getAppSession } from "@/lib/server/auth";
import { ReportCard } from "@/models/ReportCard";

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ reportCardId: string }>;
}) {
  const session = await getAppSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { reportCardId } = await params;

  if (!Types.ObjectId.isValid(reportCardId)) {
    notFound();
  }

  await connectMongoose();
  const reportCard = await ReportCard.findById(reportCardId).lean();

  if (!reportCard) {
    notFound();
  }

  if (
    session.user.role === "student" &&
    String(reportCard.studentId) !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const view = buildReportCardView(reportCard);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fafafa_0%,#f3f4f6_45%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              Student Report Card
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              {view.studentName}
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              {view.className} • {view.term} • {view.sessionLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              DMS Number: {view.studentDmsNumber || "N/A"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/report-cards/${view.id}/export?format=pdf`}
              className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Download PDF
            </a>
            <a
              href={`/api/report-cards/${view.id}/export?format=png`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              PNG
            </a>
            <a
              href={`/api/report-cards/${view.id}/export?format=jpeg`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              JPEG
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Attendance" value={String(view.attendanceDays ?? "-")} />
          <Stat label="Subjects" value={String(view.subjectCount)} />
          <Stat label="Total Score" value={`${view.totalObtained}`} />
          <Stat label="Average" value={`${view.average.toFixed(2)}%`} />
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-full border border-slate-300 text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="border border-slate-300 px-3 py-2">Subject</th>
                <th className="border border-slate-300 px-3 py-2">CA</th>
                <th className="border border-slate-300 px-3 py-2">Exam</th>
                <th className="border border-slate-300 px-3 py-2">Total</th>
                <th className="border border-slate-300 px-3 py-2">Grade</th>
                <th className="border border-slate-300 px-3 py-2">Remark</th>
              </tr>
            </thead>
            <tbody>
              {view.subjects.map((item) => (
                <tr key={item.subject}>
                  <td className="border border-slate-300 px-3 py-2">{item.subject}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.classWork}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.examScore}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.total}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.grade}</td>
                  <td className="border border-slate-300 px-3 py-2">{item.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <CommentCard label="Teacher's Comment" value={view.teacherComment} />
          <CommentCard label="Principal's Comment" value={view.principalComment} />
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Next term begins: {view.nextTermBegins || "Not provided"}
        </p>

        <div className="mt-8">
          <Link
            href={session.user.role === "admin" ? "/admin/report-cards" : "/dashboard"}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CommentCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-950">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}
