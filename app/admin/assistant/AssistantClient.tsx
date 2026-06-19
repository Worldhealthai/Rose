"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { ask } from "./actions";
import type { ChatTurn } from "@/lib/assistant";

const SUGGESTIONS = [
  "From June 9, how much do I owe Sarina for the hours she worked?",
  "How many hours did Hadisa work this week?",
  "Who is paid up to the latest date?",
  "What were our takings this month?",
];

type Msg = ChatTurn | { role: "error"; content: string };

export function AssistantClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, pending]);

  function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    const history = messages.filter(
      (m): m is ChatTurn => m.role === "user" || m.role === "assistant",
    );
    setMessages((m) => [...m, { role: "user", content: q }]);
    setDraft("");
    startTransition(async () => {
      try {
        const res = await ask({ question: q, history });
        setMessages((m) => [
          ...m,
          res.ok
            ? { role: "assistant", content: res.answer }
            : { role: "error", content: res.error },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { role: "error", content: "Something went wrong. Please try again." },
        ]);
      }
    });
  }

  return (
    <div className="flex h-[calc(100dvh-13rem)] min-h-[24rem] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3 pr-1">
        {messages.length === 0 && (
          <div className="card p-4">
            <p className="text-sm text-ink-muted">
              Ask about hours, pay owed, wage payments or takings. Try:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl border border-border bg-canvas/40 px-3 py-1.5 text-left text-xs text-ink-muted transition hover:border-forest-500/50 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-forest-600/70 px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-white">
                  {m.content}
                </p>
              </div>
            </div>
          ) : m.role === "assistant" ? (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-forest-500/15 text-forest-300">
                <Icon name="star" className="h-4 w-4" />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-border-soft bg-surface px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {m.content}
                </p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-danger/15 text-danger">
                <Icon name="alert" className="h-4 w-4" />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-danger/30 bg-danger/10 px-3.5 py-2">
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {m.content}
                </p>
              </div>
            </div>
          ),
        )}

        {pending && (
          <div className="flex items-center gap-2 text-sm text-ink-faint">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-forest-500/15 text-forest-300">
              <Icon name="star" className="h-4 w-4" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest-400" />
              Looking it up…
            </span>
          </div>
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
              send(draft);
            }
          }}
          placeholder="Ask a question…"
          rows={1}
          className="input max-h-32 min-h-[2.9rem] flex-1 resize-none"
        />
        <button
          type="button"
          onClick={() => send(draft)}
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
