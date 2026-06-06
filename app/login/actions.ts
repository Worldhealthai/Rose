"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, landingPathFor, normalizeUsername } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { getLocale } from "@/lib/locale";
import { getDict } from "@/lib/i18n";

export async function signIn(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const t = getDict(getLocale()).login;
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) return t.errEnter;

  const user = await prisma.employee.findUnique({ where: { username } });
  if (!user || !user.active) return t.errIncorrect;

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return t.errIncorrect;

  const role = user.role === "ADMIN" ? "ADMIN" : "STAFF";
  await createSession({ id: user.id, name: user.name, role });
  redirect(landingPathFor(role));
}

export async function signOut(): Promise<void> {
  destroySession();
  redirect("/login");
}
