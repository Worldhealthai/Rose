import "server-only";
import { prisma } from "./prisma";
import { formatChatTime } from "./dates";
import type { ChatMsg } from "@/components/ChatClient";

/** Latest messages (oldest→newest), serialized for the chat UI. */
export async function getChatMessages(meId: string): Promise<ChatMsg[]> {
  const rows = await prisma.chatMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { avatar: true } } },
  });
  return rows.reverse().map((m) => ({
    id: m.id,
    body: m.body,
    authorName: m.authorName,
    avatar: m.author?.avatar ?? null,
    mine: m.authorId === meId,
    time: formatChatTime(m.createdAt),
  }));
}

/** Mark the chat as read for this user (clears their unread badge). */
export async function markChatRead(meId: string): Promise<void> {
  await prisma.employee
    .update({ where: { id: meId }, data: { chatLastReadAt: new Date() } })
    .catch(() => {});
}

/** Unread chat messages for the badge (others' messages since last read). */
export async function getUnreadChatCount(
  meId: string,
  lastReadAt: Date | null,
): Promise<number> {
  try {
    return await prisma.chatMessage.count({
      where: {
        createdAt: { gt: lastReadAt ?? new Date(0) },
        NOT: { authorId: meId },
      },
    });
  } catch {
    return 0;
  }
}
