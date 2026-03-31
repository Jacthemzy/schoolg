import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import type { UserRole } from "@/models/User";

type AppSession = Session & {
  user?: {
    id?: string;
    role?: UserRole;
    dmsNumber?: string;
    className?: string;
    email?: string | null;
    name?: string | null;
  };
};

export async function getAppSession() {
  return (await getServerSession(authOptions)) as AppSession | null;
}

export async function requireSession() {
  const session = await getAppSession();

  if (!session?.user?.id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { ok: true as const, session };
}

export async function requireRole(role: "admin" | "student") {
  const auth = await requireSession();

  if (!auth.ok) {
    return auth;
  }

  if (auth.session.user?.role !== role) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return auth;
}
