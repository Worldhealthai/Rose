import "server-only";
import { cache as reactCache } from "react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession, type SessionUser } from "./session";

/**
 * Normalise a typed password: trim stray spaces and fold Persian (۰-۹) and
 * Arabic (٠-٩) digits to ASCII, so a Persian keyboard typing "1234" still
 * matches a password stored with Latin digits.
 */
export function normalizePassword(plain: string): string {
  const fold = (ch: string) => {
    const c = ch.codePointAt(0)!;
    if (c >= 0x06f0 && c <= 0x06f9) return String(c - 0x06f0); // ۰-۹
    if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660); // ٠-٩
    return ch;
  };
  return [...plain.trim()].map(fold).join("");
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(normalizePassword(plain), 10);
}

/** Check a typed password against a hash, tolerating spaces/Persian digits. */
export async function passwordMatches(
  typed: string,
  hash: string,
): Promise<boolean> {
  if (await bcrypt.compare(typed, hash)) return true;
  const normalized = normalizePassword(typed);
  if (normalized !== typed) return bcrypt.compare(normalized, hash);
  return false;
}

/** Usernames are case-insensitive and have no spaces. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * Validate a profile-picture data URL. Returns the value if it's a small image
 * data URL, an empty string to clear it, or undefined to leave unchanged.
 */
export function cleanAvatar(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (!v.startsWith("data:image/")) return null;
  if (v.length > 900_000) return null; // ~700KB image; resized client-side
  return v;
}

/**
 * On a brand-new (empty) database, create a default admin so the owner can log
 * in. Username "admin", password from ADMIN_PASSWORD env or "admin123".
 * Safe to call repeatedly — it no-ops once any employee exists.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  try {
    if ((await prisma.employee.count()) > 0) return;
    await prisma.employee.create({
      data: {
        name: "Admin",
        username: "admin",
        passwordHash: await hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
        role: "ADMIN",
        position: "Manager",
      },
    });
  } catch {
    // Best-effort: an admin already exists, or the DB is momentarily busy.
    // Never let this block the login page from rendering.
  }
}

/**
 * Full Employee record for the logged-in user, or null.
 * Wrapped in React cache() so the layout and page share one DB lookup per
 * request instead of each doing their own.
 */
export const getCurrentUser = reactCache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.employee.findUnique({
    where: { id: session.id },
  });
  if (!user || !user.active) return null;
  return user;
});

/**
 * Like getCurrentUser, but never throws (returns null on DB hiccups).
 * Use on pages that must render rather than crash or redirect-loop.
 */
export async function getCurrentUserSafe() {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
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
