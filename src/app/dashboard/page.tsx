import Link from "next/link";
import { redirect } from "next/navigation";
import { StudentSignOutButton } from "@/components/auth/student-sign-out-button";
import { connectMongoose } from "@/lib/mongoose";
import { getAppSession } from "@/lib/server/auth";
import { Exam } from "@/models/Exam";
import { ReportCard } from "@/models/ReportCard";
import { Result } from "@/models/Result";

export default async function DashboardPage() {
  const session = await getAppSession();

  if (!session?.user?.id || session.user.role !== "student") {
    redirect("/");
  }

  await connectMongoose();

  const [exams, results, reportCards] = await Promise.all([
    Exam.find({ isActive: true, classTarget: session.user.className }).sort({ createdAt: -1 }).lean(),
    Result.find({ studentId: session.user.id }).sort({ createdAt: -1 }).lean(),
    ReportCard.find({ studentId: session.user.id }).sort({ updatedAt: -1 }).lean(),
  ]);

  const resultMap = new Map(results.map((result) => [String(result.examId), result]));

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#effcf5_45%,#ffffff_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Student Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                Welcome, {session.user.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                DMS Number: {session.user.dmsNumber} • Class: {session.user.className}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Using a shared device? Sign out here before another student signs in or creates an account.
              </p>
            </div>
            <StudentSignOutButton />
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Available Exams</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Start an active exam with the correct password. Reading time begins before the main timer.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {exams.length === 0 ? (
                <p className="text-sm text-slate-600">No active exams are available for your class right now.</p>
              ) : (
                exams.map((exam) => {
                  const attempt = resultMap.get(String(exam._id));
                  const isComplete = attempt?.status === "submitted";

                  return (
                    <article key={String(exam._id)} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-950">{exam.title}</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {exam.subject} • Reading {exam.readingTime} min • Exam {exam.duration} min
                          </p>
                          {exam.description ? (
                            <p className="mt-3 text-sm leading-6 text-slate-700">{exam.description}</p>
                          ) : null}
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {isComplete ? "Completed" : attempt ? "Continue" : "Not Started"}
                        </div>
                      </div>
                      <div className="mt-5">
                        {isComplete ? (
                          <Link
                            href={`/results/${String(attempt?._id)}`}
                            className="inline-flex items-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            View Result
                          </Link>
                        ) : (
                          <Link
                            href={`/exam/${String(exam._id)}`}
                            className="inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            {attempt ? "Continue Exam" : "Start Exam"}
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Result History</h2>
              <div className="mt-5 space-y-4">
                {results.length === 0 ? (
                  <p className="text-sm text-slate-600">No exam history yet.</p>
                ) : (
                  results.map((result) => (
                    <Link
                      key={String(result._id)}
                      href={`/results/${String(result._id)}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {result.status === "submitted" ? "Submitted exam" : "In-progress exam"}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Score: {result.score} / {result.totalMarks}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Report Cards</h2>
              <div className="mt-5 space-y-4">
                {reportCards.length === 0 ? (
                  <p className="text-sm text-slate-600">No report cards have been published for you yet.</p>
                ) : (
                  reportCards.map((reportCard) => (
                    <Link
                      key={String(reportCard._id)}
                      href={`/report-cards/${String(reportCard._id)}`}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {reportCard.term} Report Card
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Session: {reportCard.sessionLabel} • Class: {reportCard.className}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
