"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type QuickLink = {
  href: string;
  label: string;
};

type AuthShellProps = {
  badge: string;
  title: string;
  description: string;
  children: ReactNode;
  asideTitle?: string;
  asideDescription?: string;
  highlights?: string[];
  quickLinks?: QuickLink[];
};

export function AuthShell({
  badge,
  title,
  description,
  children,
  asideTitle = "Welcome back",
  asideDescription = "Use the secure portal that matches your role to continue.",
  highlights = [],
  quickLinks = [],
}: AuthShellProps) {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.16),_transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eefbf3_45%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-between gap-8 border-b border-emerald-100/80 bg-slate-950 px-6 py-8 text-white sm:px-8 lg:min-h-[760px] lg:border-b-0 lg:border-r">
            <div className="space-y-5">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                {badge}
              </span>
              <div className="space-y-3">
                <h1 className="max-w-md text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">{asideTitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {asideDescription}
                </p>
              </div>

              {highlights.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      {highlight}
                    </div>
                  ))}
                </div>
              ) : null}

              {quickLinks.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
