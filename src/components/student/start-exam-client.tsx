"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartExamClient({
  examId,
  exam,
}: {
  examId: string;
  exam: {
    title: string;
    description?: string;
    subject: string;
    classTarget: string;
    readingTime: number;
    duration: number;
    totalMarks: number;
  };
}) {
  const router = useRouter();
  const [examPassword, setExamPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startExam() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/student/exams/${examId}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ examPassword }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not start the exam.");
      return;
    }

    router.replace(data.redirectTo ?? `/exam/${examId}`);
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eefbf3_45%,#ffffff_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Start Exam
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            {exam.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {exam.subject} • {exam.classTarget} • Reading {exam.readingTime} min • Exam {exam.duration} min
          </p>
          {exam.description ? (
            <p className="mt-4 text-sm leading-6 text-slate-700">{exam.description}</p>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Exam rules</h2>
          <ul className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <li className="rounded-2xl bg-white px-4 py-3">Reading time comes first and cannot be skipped.</li>
            <li className="rounded-2xl bg-white px-4 py-3">Questions appear one at a time only.</li>
            <li className="rounded-2xl bg-white px-4 py-3">There is no previous button and no question panel.</li>
            <li className="rounded-2xl bg-white px-4 py-3">The exam submits automatically when time ends.</li>
          </ul>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-slate-800">Enter exam password</label>
          <input
            type="password"
            value={examPassword}
            onChange={(event) => setExamPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Exam password"
          />
          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            onClick={startExam}
            disabled={loading}
            className="mt-5 inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </section>
      </div>
    </div>
  );
}
