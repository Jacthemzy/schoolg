import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { StudentSignOutButton } from "@/components/auth/student-sign-out-button";
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
  const generatedLabel = new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(view.generatedAt);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dcfce7_0%,#f8fafc_22%,#e5e7eb_58%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-emerald-950/10 bg-white shadow-[0_25px_90px_rgba(15,23,42,0.12)]">
        <div className="h-3 bg-[linear-gradient(90deg,#14532d_0%,#16a34a_30%,#bbf7d0_100%)]" />
        <div className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Divine Mission School
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Education for Success and Peace
            </p>
            <p className="mt-1 text-sm text-slate-600">
              08164039006, 08106565953
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Student Report Card
            </h1>
            <p className="mt-2 text-lg font-medium text-slate-900">
              {view.studentName}
            </p>
            <p className="mt-2 text-sm text-slate-700">
              {view.className} • {view.term} • {view.sessionLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              DMS Number: {view.studentDmsNumber || "N/A"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Gender: {view.gender || "Not provided"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <SchoolStamp schoolName={view.schoolName} generatedLabel={generatedLabel} />
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/report-cards/${view.id}/export?format=pdf`}
                className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Download PDF
              </a>
              <a
                href={`/api/report-cards/${view.id}/export?format=svg`}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Download SVG
              </a>
            </div>
            {session.user.role === "student" ? <StudentSignOutButton /> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_70%,#ecfdf5_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Student Details
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem label="Student Name" value={view.studentName} />
              <DetailItem label="DMS Number" value={view.studentDmsNumber || "N/A"} />
              <DetailItem label="Class" value={view.className} />
              <DetailItem label="Gender" value={view.gender || "Not provided"} />
              <DetailItem label="Term" value={view.term} />
              <DetailItem label="Session" value={view.sessionLabel} />
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-emerald-900/10 bg-[linear-gradient(160deg,#f0fdf4_0%,#ffffff_100%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Generation Record
            </p>
            <div className="mt-4 space-y-3">
              <DetailItem label="Generated" value={generatedLabel} />
              <DetailItem label="Teacher" value={view.teacherName || "Class Teacher"} />
              <DetailItem label="Next Term Begins" value={view.nextTermBegins || "-"} />
              <DetailItem label="Resumption Date" value={view.resumptionDate || "-"} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Attendance" value={String(view.attendanceDays ?? "-")} />
          <Stat label="Subjects" value={String(view.subjectCount)} />
          <Stat label="Total Score" value={`${view.totalObtained}`} />
          <Stat label="Average" value={`${view.average.toFixed(2)}%`} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Teacher" value={view.teacherName || "Class Teacher"} />
          <Stat label="Next Term" value={view.nextTermBegins || "-"} />
          <Stat label="Resumption" value={view.resumptionDate || "-"} />
        </div>

        <div className="mt-8 overflow-x-auto">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-300 bg-white">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <WatermarkStamp schoolName={view.schoolName} generatedLabel={generatedLabel} />
            </div>
            <table className="relative min-w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100/95 text-xs uppercase tracking-wide text-slate-700">
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
                  <tr key={item.subject} className="bg-white/88">
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
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <CommentCard label="Teacher's Comment" value={view.teacherComment} />
          <CommentCard label="Principal's Comment" value={view.principalComment} />
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <SignatureCard
              role="Class Teacher"
              name={view.teacherName || "Class Teacher"}
              generatedLabel={generatedLabel}
            />
            <SignatureCard
              role="Principal"
              name="Divine Mission School"
              generatedLabel={generatedLabel}
            />
          </div>
        </div>

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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CommentCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-950">{label}</p>
      <p className="mt-3 text-sm leading-7 text-slate-700">{value}</p>
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
    <div className="relative h-40 w-40 rounded-full border-[4px] border-emerald-700/60 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95)_0%,rgba(220,252,231,0.82)_58%,rgba(187,247,208,0.7)_100%)] text-center text-emerald-950 shadow-[0_18px_45px_rgba(22,101,52,0.14)]">
      <div className="absolute inset-[10px] rounded-full border-[2px] border-emerald-800/55" />
      <div className="absolute inset-[20px] rounded-full border border-dashed border-emerald-700/40" />
      <div className="flex h-full flex-col items-center justify-center px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-emerald-800/80">
          Official Stamp
        </p>
        <p className="mt-2 text-sm font-bold uppercase leading-4">{schoolName}</p>
        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-800/80">
          Education for Success and Peace
        </p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.22em] text-emerald-900/70">
          Generated On
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-4">{generatedLabel}</p>
      </div>
    </div>
  );
}

function WatermarkStamp({
  schoolName,
  generatedLabel,
}: {
  schoolName: string;
  generatedLabel: string;
}) {
  return (
    <div className="flex h-[18rem] w-[18rem] rotate-[-14deg] flex-col items-center justify-center rounded-full border-[5px] border-emerald-700/10 bg-emerald-100/10 text-center text-emerald-950/10">
      <div className="flex h-[15.5rem] w-[15.5rem] flex-col items-center justify-center rounded-full border-[3px] border-dashed border-emerald-700/10 px-8">
        <p className="text-xs font-bold uppercase tracking-[0.38em]">Official Stamp</p>
        <p className="mt-3 text-xl font-bold uppercase leading-6">{schoolName}</p>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em]">
          Education for Success and Peace
        </p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.28em]">Generated On</p>
        <p className="mt-1 text-xs font-semibold">{generatedLabel}</p>
      </div>
    </div>
  );
}

function SignatureCard({
  role,
  name,
  generatedLabel,
}: {
  role: string;
  name: string;
  generatedLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {role} Authorization
      </p>
      <div className="mt-6">
        <p className="font-serif text-3xl italic text-slate-900">{makeSignature(name)}</p>
        <div className="mt-3 h-px w-full bg-slate-300" />
        <div className="mt-3 flex items-start justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold uppercase tracking-[0.14em] text-slate-600">{role}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{name}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold uppercase tracking-[0.14em] text-slate-600">Signed</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{generatedLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function makeSignature(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
