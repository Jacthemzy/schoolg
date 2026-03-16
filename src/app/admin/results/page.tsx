"use client";

import { useState } from "react";
import { useAdminResults } from "@/hooks/use-admin-results";

export default function AdminResultsPage() {
  const [examIdFilter, setExamIdFilter] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const { data: results, isLoading } = useAdminResults({
    examId: examIdFilter || undefined,
    className: classFilter || undefined,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Filter Results</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium">Exam ID (optional)</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={examIdFilter}
              onChange={(e) => setExamIdFilter(e.target.value)}
              placeholder="Paste exam ID"
            />
          </div>
          <div>
            <label className="text-xs font-medium">Class (optional)</label>
            <input
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="e.g. JSS1"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Results</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading results…</p>
        ) : !results || results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No results found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-xs text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">DMS Number</th>
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Class</th>
                  <th className="py-2 pr-4">Exam</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.dmsNumber}</td>
                    <td className="py-2 pr-4">{r.studentName}</td>
                    <td className="py-2 pr-4">{r.className}</td>
                    <td className="py-2 pr-4">{r.examTitle}</td>
                    <td className="py-2 pr-4">{r.subject}</td>
                    <td className="py-2 pr-4">
                      {r.score} / {r.totalMarks}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          r.status === "submitted"
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {r.submittedAt
                        ? new Date(r.submittedAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

