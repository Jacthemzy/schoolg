import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { StudentLoginForm } from "@/components/auth/student-login-form";
import { getAppSession } from "@/lib/server/auth";

export default async function HomePage() {
  const session = await getAppSession();

  if (session?.user?.role === "student") {
    redirect("/dashboard");
  }

  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <AuthShell
      badge="Divine Mission School"
      title="DMS CBT Examination System for secure, timed, forward-only testing."
      description="Students can register and log in from the front page, move into protected exam sessions, complete reading time, and sit strict CBT exams with automatic timing and submission rules."
      asideTitle="System features"
      asideDescription="The portal is built for Divine Mission School with student onboarding, role-based access, active exam listing, reading time mode, timed exam mode, and results tracking."
      highlights={[
        "Unlimited DMS student registration",
        "Reading timer before the main exam begins",
        "One-question, forward-only navigation",
      ]}
      quickLinks={[
        { href: "/signup", label: "Create student account" },
        { href: "/login/admin", label: "Admin login" },
      ]}
    >
      <div className="grid gap-4">
        <StudentLoginForm
          title="Student login"
          description="Sign in with your DMS Number and password to enter your DMS dashboard and continue to active CBT exams."
        />

        <div className="grid gap-4 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-950">What students can do</p>
            <p className="mt-1 leading-6">
              Register with DMS Number, view active exams for their class, enter an exam password, complete reading time, and write timed exams with no backward navigation.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">What admins can do</p>
            <p className="mt-1 leading-6">
              Manage students, create exams, set reading time and duration, add questions, activate exams, and review results.
            </p>
          </div>
          <Link
            href="/login/admin"
            className="inline-flex w-fit items-center rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
          >
            Open admin portal
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
