"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  requireAdmin,
  getCurrentUser,
  normalizeUsername,
  cleanAvatar,
} from "@/lib/auth";
import { parseMoney } from "@/lib/money";

const BASE = "/admin/employees";

function back(msg?: string, kind: "ok" | "error" = "ok"): never {
  redirect(msg ? `${BASE}?${kind}=${encodeURIComponent(msg)}` : BASE);
}

function isUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002"
  );
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function createEmployee(formData: FormData) {
  await requireAdmin();
  const name = str(formData, "name");
  const username = normalizeUsername(str(formData, "username"));
  const password = str(formData, "password");
  const role = str(formData, "role") === "ADMIN" ? "ADMIN" : "STAFF";

  if (!name || !username || !password) {
    back("Name, username and password are required.", "error");
  }
  if (password.length < 6) {
    back("Password must be at least 6 characters.", "error");
  }

  try {
    await prisma.employee.create({
      data: {
        name,
        username,
        email: str(formData, "email").toLowerCase() || null,
        avatar: cleanAvatar(formData.get("avatar")),
        passwordHash: await hashPassword(password),
        role,
        position: str(formData, "position") || null,
        hourlyRate: parseMoney(formData.get("hourlyRate")),
        phone: str(formData, "phone") || null,
      },
    });
  } catch (e) {
    if (isUniqueError(e)) back("That username is already taken.", "error");
    throw e;
  }
  revalidatePath(BASE);
  back(`${name} added to the team.`);
}

export async function updateEmployee(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  if (!id) back("Missing employee.", "error");
  const role = str(formData, "role") === "ADMIN" ? "ADMIN" : "STAFF";

  const username = normalizeUsername(str(formData, "username"));
  if (!username) back("Username is required.", "error");

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        name: str(formData, "name"),
        username,
        email: str(formData, "email").toLowerCase() || null,
        avatar: cleanAvatar(formData.get("avatar")),
        role,
        position: str(formData, "position") || null,
        hourlyRate: parseMoney(formData.get("hourlyRate")),
        phone: str(formData, "phone") || null,
        active: formData.get("active") === "on",
      },
    });
  } catch (e) {
    if (isUniqueError(e)) back("That username is already taken.", "error");
    throw e;
  }
  revalidatePath(BASE);
  back("Saved.");
}

export async function setEmployeePassword(formData: FormData) {
  await requireAdmin();
  const id = str(formData, "id");
  const password = str(formData, "password");
  if (!id || password.length < 6) {
    back("Password must be at least 6 characters.", "error");
  }
  await prisma.employee.update({
    where: { id },
    data: { passwordHash: await hashPassword(password) },
  });
  back("Password updated.");
}

export async function deleteEmployee(formData: FormData) {
  const me = await requireAdmin();
  const id = str(formData, "id");
  if (!id) back("Missing employee.", "error");
  if (id === me.id) back("You can't delete your own account.", "error");

  // Don't allow removing the last admin.
  const target = await prisma.employee.findUnique({ where: { id } });
  if (target?.role === "ADMIN") {
    const admins = await prisma.employee.count({ where: { role: "ADMIN" } });
    if (admins <= 1) back("You need at least one admin.", "error");
  }

  await prisma.employee.delete({ where: { id } });
  revalidatePath(BASE);
  back("Team member removed.");
}
