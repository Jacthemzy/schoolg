import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
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
            <a href="/admin" className="rounded-full border px-3 py-1 hover:bg-accent">
              Overview
            </a>
            <a href="/admin/exams" className="rounded-full border px-3 py-1 hover:bg-accent">
              Exams &amp; Questions
            </a>
            <a href="/admin/results" className="rounded-full border px-3 py-1 hover:bg-accent">
              Results
            </a>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

