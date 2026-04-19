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
      title="CBT Examination System"
      description="Student login, signup, and admin access."
      quickLinks={[
        { href: "/signup", label: "Sign up" },
        { href: "/login/admin", label: "Admin login" },
      ]}
    >
      <div className="grid gap-4">
        <StudentLoginForm
          title="Student login"
          description="Sign in with your DMS Number and password."
        />
      </div>
    </AuthShell>
  );
}
