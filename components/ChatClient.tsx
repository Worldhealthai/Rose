"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { Icon } from "./icons";
import { sendChatMessage } from "@/app/actions/chat";

export type ChatMsg = {
  id: string;
  body: string;
  authorName: string;
  avatar: string | null;
  mine: boolean;
  time: string; // pre-formatted on the server
};

export function ChatClient({
  messages,
  placeholder,
  empty,
}: {
  messages: ChatMsg[];
  placeholder: string;
  empty: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  // Refresh once on open — the page render just marked the chat as read, and
  // this re-renders the layout so the unread badge in the nav clears straight
  // away. Then keep polling for new messages while the chat is open.
  useEffect(() => {
    router.refresh();
    const id = setInterval(() => router.refresh(), 12000);
    return () => clearInterval(id);
  }, [router]);

  // Keep the view pinned to the latest message.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);

  function send() {
    const body = draft.trim();
    if (!body || pending) return;
    setDraft("");
    const fd = new FormData();
    fd.set("body", body);
    startTransition(async () => {
      try {
        await sendChatMessage(fd);
        if (mounted.current) router.refresh();
      } catch {
        // message stays sent server-side or user can retry; never crash
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-15.5rem)] min-h-[20rem] flex-col md:h-[calc(100dvh-13rem)]">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3 pr-1">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">{empty}</p>
        )}
        {messages.map((m) =>
          m.mine ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-forest-600/70 px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-white">
                  {m.body}
                </p>
                <p className="mt-0.5 text-right text-[10px] text-white/60">{m.time}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <Avatar name={m.authorName} src={m.avatar} size={28} />
              <div className="max-w-[80%] rounded-2xl rounded-bl-md border border-border-soft bg-surface px-3.5 py-2">
                <p className="text-[11px] font-semibold text-forest-300">
                  {m.authorName}
                </p>
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {m.body}
                </p>
                <p className="mt-0.5 text-[10px] text-ink-faint">{m.time}</p>
              </div>
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border-soft pt-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="input max-h-32 min-h-[2.9rem] flex-1 resize-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={pending || !draft.trim()}
          aria-label="Send"
          className="btn-primary !px-4 !py-3"
        >
          <Icon name="chevronRight" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
