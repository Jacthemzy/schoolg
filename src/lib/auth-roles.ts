export type Role = "admin" | "student";

export function isAdmin(role?: string | null) {
  return role === "admin";
}

export function isStudent(role?: string | null) {
  return role === "student";
}

