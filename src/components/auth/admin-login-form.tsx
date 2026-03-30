"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { FormError } from "@/components/auth/form-error";

const adminLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: AdminLoginInput) {
    setError(null);

    try {
      const res = await signIn("admin-credentials", {
        redirect: false,
        callbackUrl: "/admin",
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        setError("Invalid admin email or password.");
        return;
      }

      if (!res?.ok || !res.url) {
        setError("Login could not be completed. Please try again.");
        return;
      }

      window.location.assign(res.url);
    } catch {
      setError("Login could not be completed. Please try again.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
          Admin login
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Administrators can manage exams, questions, and results from here.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <label
            htmlFor="admin-email"
            className="text-sm font-medium text-slate-800"
          >
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            autoComplete="email"
            {...form.register("email")}
          />
          <FormError message={form.formState.errors.email?.message} />
        </div>

        <div>
          <label
            htmlFor="admin-password"
            className="text-sm font-medium text-slate-800"
          >
            Password
          </label>
          <input
            id="admin-password"
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
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.formState.isSubmitting ? "Signing in..." : "Login as admin"}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
        <p>
          Student access is available on the{" "}
          <Link
            href="/"
            className="font-semibold text-emerald-700 hover:underline"
          >
            home login page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
