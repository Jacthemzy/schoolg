import { AdminLoginForm } from "@/components/auth/admin-login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function AdminLoginPage() {
  return (
    <AuthShell
      badge="Admin Portal"
      title="Administration access for exams, questions, and results."
      description="Keep the admin area separate from student login so staff can manage the system without confusion. The layout stays compact on phones and expands cleanly on larger displays."
      highlights={[
        "Separate admin authentication flow",
        "Optimized for phones, tablets, and desktop",
        "Direct path into the dashboard after sign-in",
      ]}
      quickLinks={[{ href: "/", label: "Back to home login" }]}
    >
      <AdminLoginForm />
    </AuthShell>
  );
}
