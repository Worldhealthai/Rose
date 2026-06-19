"use server";

import { requireAdmin } from "@/lib/auth";
import { runAssistant, type ChatTurn, type AssistantResult } from "@/lib/assistant";

export async function ask(input: {
  question: string;
  history: ChatTurn[];
}): Promise<AssistantResult> {
  await requireAdmin();
  const question = String(input?.question ?? "").trim().slice(0, 1000);
  if (!question) return { ok: false, error: "Type a question first." };
  const history = Array.isArray(input?.history) ? input.history.slice(-8) : [];
  return runAssistant(question, history);
}
