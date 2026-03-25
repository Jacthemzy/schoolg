"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormError } from "@/components/auth/form-error";

const studentLoginSchema = z.object({
  dmsNumber: z
    .string()
    .regex(/^DMS\d{3,}$/, "DMS Number must look like DMS001, DMS002, ..."),
  password: z.string().min(1, "Password is required"),
});

type StudentLoginInput = z.infer<typeof studentLoginSchema>;

type StudentLoginFormProps = {
  title?: string;
  description?: string;
  showAdminLink?: boolean;
};

export function StudentLoginForm({
  title = "Student login",
  description = "Enter your DMS Number and password to continue to your exam portal.",
  showAdminLink = true,
}: StudentLoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StudentLoginInput>({
    resolver: zodResolver(studentLoginSchema),
    defaultValues: {
      dmsNumber: "",
      password: "",
    },
  });

  async function onSubmit(values: StudentLoginInput) {
    setError(null);

    const res = await signIn("student-credentials", {
      redirect: false,
      dmsNumber: values.dmsNumber,
      password: values.password,
    });

    if (res?.error) {
      setError("Invalid DMS Number or password.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="student-dms-number"
            className="text-sm font-medium text-slate-800"
          >
            DMS Number
          </label>
          <input
            id="student-dms-number"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="DMS001"
            autoComplete="username"
            {...form.register("dmsNumber")}
          />
          <FormError message={form.formState.errors.dmsNumber?.message} />
        </div>

        <div>
          <label
            htmlFor="student-password"
            className="text-sm font-medium text-slate-800"
          >
            Password
          </label>
          <input
            id="student-password"
            type="password"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            autoComplete="current-password"
            {...form.register("password")}
          />
          <FormError message={form.formState.errors.password?.message} />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.formState.isSubmitting ? "Signing in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          New student?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Create an account
          </Link>
        </p>
        {showAdminLink ? (
          <Link
            href="/login/admin"
            className="font-semibold text-slate-900 hover:text-emerald-700 hover:underline"
          >
            Admin login
          </Link>
        ) : null}
      </div>
    </div>
  );
}
