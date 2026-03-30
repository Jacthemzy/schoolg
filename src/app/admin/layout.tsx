import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/server/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAppSession();

  if (!session?.user?.id) {
    redirect("/login/admin");
  }

  if (session.user.role !== "admin") {
    redirect(session.user.role === "student" ? "/dashboard" : "/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">DMS Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage students, exams, questions, and results.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin" className="rounded-full border px-3 py-1 hover:bg-accent">
              Overview
            </Link>
            <Link href="/admin/students" className="rounded-full border px-3 py-1 hover:bg-accent">
              Students
            </Link>
            <Link href="/admin/exams" className="rounded-full border px-3 py-1 hover:bg-accent">
              Exams &amp; Questions
            </Link>
            <Link href="/admin/results" className="rounded-full border px-3 py-1 hover:bg-accent">
              Results
            </Link>
            <Link href="/admin/report-cards" className="rounded-full border px-3 py-1 hover:bg-accent">
              Report Cards
            </Link>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

