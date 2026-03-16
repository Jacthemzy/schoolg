import { AuthShell } from "@/components/auth/auth-shell";
import { StudentLoginForm } from "@/components/auth/student-login-form";

export default function StudentLoginPage() {
  return (
    <AuthShell
      badge="Student Portal"
      title="Secure student access for exams and assessments."
      description="This dedicated page keeps the student sign-in flow available even outside the home page, with the same mobile-friendly experience across devices."
      highlights={[
        "Fast sign-in for returning students",
        "DMS Number validation before submit",
        "Responsive form spacing on every screen size",
      ]}
      quickLinks={[{ href: "/login/admin", label: "Admin login" }]}
    >
      <StudentLoginForm showAdminLink={false} />
    </AuthShell>
  );
}
