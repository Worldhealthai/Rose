"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { sendChatPush } from "@/lib/push";

export async function sendChatMessage(formData: FormData) {
  const me = await requireUser();
  const body = String(formData.get("body") ?? "")
    .trim()
    .slice(0, 1000);
  if (!body) return;

  await prisma.chatMessage.create({
    data: { body, authorId: me.id, authorName: me.name },
  });
  // Sending counts as having read the chat up to now.
  await prisma.employee
    .update({ where: { id: me.id }, data: { chatLastReadAt: new Date() } })
    .catch(() => {});

  await sendChatPush(me.id, me.name, body);

  revalidatePath("/staff/chat");
  revalidatePath("/admin/chat");
}
