"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const signupSchema = z.object({
  dmsNumber: z
    .string()
    .regex(/^DMS\d{3,}$/, "DMS Number must look like DMS001, DMS002, ..."),
  fullName: z.string().min(1, "Full name is required"),
  className: z.string().min(1, "Class is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type SignupInput = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      dmsNumber: "",
      fullName: "",
      className: "",
      password: "",
    },
  });

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    setServerSuccess(null);

    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setServerError(
        data?.error ||
          "Could not create account. Please check your details and try again.",
      );
      return;
    }

    setServerSuccess("Account created. Logging you in…");

    await signIn("student-credentials", {
      redirect: true,
      dmsNumber: values.dmsNumber,
      password: values.password,
      callbackUrl: "/dashboard",
    });

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.16),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eefbf3_45%,#ffffff_100%)] px-4 py-8">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          DMS Student Signup
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register with your DMS Number, full name, class, and password to access CBT exams.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div>
            <label className="text-xs font-medium">DMS Number</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="DMS001"
              {...form.register("dmsNumber")}
            />
            <Error message={form.formState.errors.dmsNumber?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Full Name</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              {...form.register("fullName")}
            />
            <Error message={form.formState.errors.fullName?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Class</label>
            <input
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              placeholder="e.g. JSS1, SS2"
              {...form.register("className")}
            />
            <Error message={form.formState.errors.className?.message} />
          </div>

          <div>
            <label className="text-xs font-medium">Password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
              {...form.register("password")}
            />
            <Error message={form.formState.errors.password?.message} />
          </div>

          {serverError && (
            <p className="text-xs text-destructive">{serverError}</p>
          )}
          {serverSuccess && (
            <p className="text-xs text-emerald-600">{serverSuccess}</p>
          )}

          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="mt-2 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {form.formState.isSubmitting ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-600">
          Already registered?{" "}
          <Link href="/login/student" className="font-medium text-emerald-700 hover:underline">
            Student login
          </Link>
        </p>
      </div>
    </div>
  );
}

function Error({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

