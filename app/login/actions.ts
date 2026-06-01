"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, landingPathFor } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";

export async function signIn(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Enter your email and password.";

  const user = await prisma.employee.findUnique({ where: { email } });
  if (!user || !user.active) return "Incorrect email or password.";

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return "Incorrect email or password.";

  const role = user.role === "ADMIN" ? "ADMIN" : "STAFF";
  await createSession({ id: user.id, name: user.name, role });
  redirect(landingPathFor(role));
}

export async function signOut(): Promise<void> {
  destroySession();
  redirect("/login");
}
