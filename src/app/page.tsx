import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { StudentLoginForm } from "@/components/auth/student-login-form";

export default function HomePage() {
  return (
    <AuthShell
      badge="DMS CBT Portal"
      title="Login from the homepage and move straight into the right portal."
      description="Students can sign in directly from the home page, while administrators have a dedicated entry point for management tasks. The layout is built to stay clear and usable on phones, tablets, laptops, and large screens."
      asideTitle="Quick access"
      asideDescription="Use the student login form on this page for normal exam access. Admins can move to the protected admin login page with one tap."
      highlights={[
        "Student-first login flow on the home route",
        "Dedicated admin access without mixing roles",
        "Responsive layout tuned for small and large screens",
      ]}
      quickLinks={[
        { href: "/login/admin", label: "Go to admin login" },
        { href: "/signup", label: "Create student account" },
      ]}
    >
      <div className="grid gap-4">
        <StudentLoginForm
          title="Student login"
          description="Sign in with your DMS Number and password to continue to your CBT session."
        />

        <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">Administrator access</p>
          <p className="mt-1 leading-6">
            Teachers and admins should use the separate admin portal to manage
            exams, questions, and results.
          </p>
          <Link
            href="/login/admin"
            className="mt-4 inline-flex items-center rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
          >
            Open admin login
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
