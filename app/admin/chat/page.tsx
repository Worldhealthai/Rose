import { requireAdmin } from "@/lib/auth";
import { getChatMessages, markChatRead } from "@/lib/chat";
import { getDict } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";
import { ChatClient } from "@/components/ChatClient";

export const dynamic = "force-dynamic";

export default async function AdminChatPage() {
  const me = await requireAdmin();
  const t = getDict("en").chat;
  const messages = await getChatMessages(me.id);
  await markChatRead(me.id);

  return (
    <div>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <ChatClient messages={messages} placeholder={t.placeholder} empty={t.empty} />
    </div>
  );
}
