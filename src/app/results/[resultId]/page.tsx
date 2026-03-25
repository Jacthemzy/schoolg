import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Types } from "mongoose";
import { connectMongoose } from "@/lib/mongoose";
import { getAppSession } from "@/lib/server/auth";
import { Result } from "@/models/Result";
import { Exam } from "@/models/Exam";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const session = await getAppSession();

  if (!session?.user?.id) {
    redirect("/");
  }

  const { resultId } = await params;

  if (!Types.ObjectId.isValid(resultId)) {
    notFound();
  }

  await connectMongoose();
  const result = await Result.findById(resultId).lean();

  if (!result) {
    notFound();
  }

  if (
    session.user.role === "student" &&
    String(result.studentId) !== session.user.id
  ) {
    redirect("/dashboard");
  }

  const exam = await Exam.findById(result.examId).lean();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eefbf3_45%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Exam Result
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">
          {exam?.title ?? "Exam Result"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {exam?.subject ?? "Subject"} • Submitted{" "}
          {result.submittedAt
            ? new Date(result.submittedAt).toLocaleString()
            : "in progress"}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Score" value={`${result.score}`} />
          <StatCard label="Total Marks" value={`${result.totalMarks}`} />
          <StatCard
            label="Status"
            value={result.status === "submitted" ? "Submitted" : "In Progress"}
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-600">
            Answered questions: {result.answers.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Correct answers recorded: {result.answers.filter((answer) => answer.isCorrect).length}
          </p>
        </div>

        <div className="mt-8">
          <Link
            href={session.user.role === "admin" ? "/admin/results" : "/dashboard"}
            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Back to {session.user.role === "admin" ? "results" : "dashboard"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
