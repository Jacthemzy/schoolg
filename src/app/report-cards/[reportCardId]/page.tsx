import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { StudentSignOutButton } from "@/components/auth/student-sign-out-button";
import { connectMongoose } from "@/lib/mongoose";
import {
  buildReportCardView,
  getGradePalette,
  type BehaviourRating,
} from "@/lib/report-card";
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
  const generatedLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(view.generatedAt);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#e2e8f0_0%,#f8fafc_35%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-800">
              Divine Mission School
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Student Report Card</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/report-cards/${view.id}/export?format=pdf`}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Download PDF
            </a>
            <a
              href={`/api/report-cards/${view.id}/export?format=svg`}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
            >
              Download SVG
            </a>
            {session.user.role === "student" ? <StudentSignOutButton /> : null}
          </div>
        </div>

        <article className="mx-auto w-full max-w-[210mm] rounded-[2rem] border border-slate-300 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] sm:p-8">
          <div className="border-b border-slate-300 pb-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-800">
                      Education for Success and Peace
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-950">{view.schoolName}</h2>
                    <p className="mt-2 text-sm text-slate-600">Official A4 report format</p>
                    <p className="mt-1 text-sm text-slate-500">Generated: {generatedLabel}</p>
                  </div>
                  <SchoolStamp schoolName={view.schoolName} generatedLabel={generatedLabel} />
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#f8fafc_100%)] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-800">
                    Student Name
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{view.studentName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {view.className} • {view.term} • {view.sessionLabel}
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <MetaItem label="DMS Number" value={view.studentDmsNumber || "N/A"} />
                <MetaItem label="Class" value={view.className} />
                <MetaItem label="Gender" value={view.gender || "Not provided"} />
                <MetaItem label="Term" value={view.term} />
                <MetaItem label="Session" value={view.sessionLabel} />
                <MetaItem label="Generated" value={generatedLabel} />
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <SummaryCard label="Attendance" value={String(view.attendanceDays ?? "-")} />
            <SummaryCard label="Subjects" value={String(view.subjectCount)} />
            <SummaryCard label="Total Score" value={String(view.totalObtained)} />
            <SummaryCard label="Average" value={`${view.average.toFixed(2)}%`} />
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-300">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-[0.18em] text-slate-600">
                <tr>
                  <th className="border border-slate-300 px-3 py-3">Subject</th>
                  <th className="border border-slate-300 px-3 py-3">CA</th>
                  <th className="border border-slate-300 px-3 py-3">Exam</th>
                  <th className="border border-slate-300 px-3 py-3">Total</th>
                  <th className="border border-slate-300 px-3 py-3">Grade</th>
                  <th className="border border-slate-300 px-3 py-3">Remark</th>
                </tr>
              </thead>
              <tbody>
                {view.subjects.map((item) => {
                  const palette = getGradePalette(item.grade);
                  return (
                    <tr key={item.subject}>
                      <td className="border border-slate-300 px-3 py-3 font-medium text-slate-900">
                        {item.subject}
                      </td>
                      <td className="border border-slate-300 px-3 py-3">{item.classWork}</td>
                      <td className="border border-slate-300 px-3 py-3">{item.examScore}</td>
                      <td className="border border-slate-300 px-3 py-3">{item.total}</td>
                      <td className="border border-slate-300 px-3 py-3">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            color: palette.text,
                            backgroundColor: palette.bg,
                            border: `1px solid ${palette.border}`,
                          }}
                        >
                          {item.grade}
                        </span>
                      </td>
                      <td className="border border-slate-300 px-3 py-3">{item.remark}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.5rem] border border-slate-300 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
                Behaviour Ratings
              </p>
              <div className="mt-4 grid gap-3">
                {view.behaviourRatings.map((item: BehaviourRating) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                      {item.rating || "Not rated"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <CommentCard label="Teacher's Comment" value={view.teacherComment} />
              <CommentCard label="Principal's Comment" value={view.principalComment} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-300 pt-6 md:grid-cols-2">
            <SignatureCard
              role="Class Teacher"
              name={view.teacherName || "Class Teacher"}
              signature={view.teacherSignature}
            />
            <SignatureCard
              role="Principal"
              name="Divine Mission School"
              signature={view.principalSignature}
            />
          </div>
        </article>

        <Link
          href={session.user.role === "admin" ? "/admin/report-cards" : "/dashboard"}
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back
        </Link>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function CommentCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-300 p-5">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">
        {label}
      </p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{value}</p>
    </div>
  );
}

function SignatureCard({
  role,
  name,
  signature,
}: {
  role: string;
  name: string;
  signature?: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-300 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {role}
      </p>
      <div className="mt-4 min-h-20 border-b border-slate-300 pb-3">
        {signature ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signature} alt={`${role} signature`} className="h-16 w-auto object-contain" />
        ) : (
          <p className="pt-8 text-sm italic text-slate-400">No signature added</p>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{name}</p>
    </div>
  );
}

function SchoolStamp({
  schoolName,
  generatedLabel,
}: {
  schoolName: string;
  generatedLabel: string;
}) {
  return (
    <div className="relative h-36 w-36 shrink-0 rounded-full border-[4px] border-emerald-700/60 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98)_0%,rgba(220,252,231,0.9)_60%,rgba(187,247,208,0.82)_100%)] text-center text-emerald-950 shadow-[0_18px_40px_rgba(22,101,52,0.14)]">
      <div className="absolute inset-[8px] rounded-full border-[2px] border-emerald-800/55" />
      <div className="absolute inset-[18px] rounded-full border border-dashed border-emerald-700/40" />
      <div className="flex h-full flex-col items-center justify-center px-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-emerald-800/80">
          Official Stamp
        </p>
        <p className="mt-2 text-xs font-bold uppercase leading-4">{schoolName}</p>
        <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-800/80">
          Generated
        </p>
        <p className="mt-1 text-[10px] font-semibold leading-4">{generatedLabel}</p>
      </div>
    </div>
  );
}
