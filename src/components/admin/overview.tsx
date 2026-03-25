"use client";

import { useAdminStudents } from "@/hooks/use-admin-students";
import { useAdminExams } from "@/hooks/use-admin-exams";
import { useAdminResults } from "@/hooks/use-admin-results";

export function AdminOverview() {
  const { data: students } = useAdminStudents();
  const { data: exams } = useAdminExams();
  const { data: results } = useAdminResults();

  const totalStudents = students?.length ?? 0;
  const totalExams = exams?.length ?? 0;
  const activeExams = exams?.filter((e) => e.isActive).length ?? 0;
  const totalResults = results?.length ?? 0;
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <OverviewCard label="Total Students" value={totalStudents} />
      <OverviewCard label="Total Exams" value={totalExams} />
      <OverviewCard label="Active Exams" value={activeExams} />
      <OverviewCard label="Total Results" value={totalResults} />
    </section>
  );
}

function OverviewCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

