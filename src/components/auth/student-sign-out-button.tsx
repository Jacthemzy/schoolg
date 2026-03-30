"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

type StudentSignOutButtonProps = {
  callbackUrl?: string;
  className?: string;
};

export function StudentSignOutButton({
  callbackUrl = "/login/student",
  className,
}: StudentSignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut({
        callbackUrl,
        redirect: true,
      });
    } catch {
      setIsSigningOut(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={
        className ??
        "inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
