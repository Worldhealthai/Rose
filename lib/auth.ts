import "server-only";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession, type SessionUser } from "./session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Full Employee record for the logged-in user, or null. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.employee.findUnique({
    where: { id: session.id },
  });
  if (!user || !user.active) return null;
  return user;
}

/** Require any logged-in user. Redirects to /login if not signed in. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require an admin. Staff are bounced to their own portal. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/staff");
  return user;
}

/** Require a logged-in staff member (admins are allowed through too). */
export async function requireStaff() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function landingPathFor(role: SessionUser["role"]): string {
  return role === "ADMIN" ? "/admin" : "/staff";
}
