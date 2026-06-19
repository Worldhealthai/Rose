import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { shiftHours, sumIncome, netIncome, CHANNELS } from "./calc";
import { entryHours } from "./timeclock";
import { money } from "./money";
import { getCommissionRates } from "./settings";
import {
  today as todayFn,
  parseDay,
  toISODate,
  addDays,
  formatShort,
  localDayISO,
} from "./dates";

const MODEL = "claude-opus-4-8";
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type AssistantResult =
  | { ok: true; answer: string }
  | { ok: false; error: string };

type EmpLite = {
  id: string;
  name: string;
  position: string | null;
  hourlyRate: number;
};

function str(input: unknown, key: string): string {
  if (input && typeof input === "object" && key in input) {
    const v = (input as Record<string, unknown>)[key];
    return v == null ? "" : String(v).trim();
  }
  return "";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

async function activeEmployees(): Promise<EmpLite[]> {
  return prisma.employee.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, position: true, hourlyRate: true },
  });
}

/** Case-insensitive match on full name or any name part (e.g. "sarina"). */
function matchEmployees(list: EmpLite[], query: string): EmpLite[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = list.filter((e) => e.name.toLowerCase() === q);
  if (exact.length) return exact;
  return list.filter((e) => {
    const name = e.name.toLowerCase();
    if (name.includes(q)) return true;
    return name.split(/\s+/).some((part) => part.startsWith(q));
  });
}

/** Hours an employee actually clocked and was rota'd between two dates. */
async function workSummary(emp: EmpLite, start: Date, end: Date) {
  const startISO = toISODate(start);
  const endISO = toISODate(end);
  const [shifts, entries] = await Promise.all([
    prisma.shift.findMany({
      where: { employeeId: emp.id, date: { gte: start, lte: end } },
      select: { start: true, end: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        employeeId: emp.id,
        clockIn: { gte: addDays(start, -1), lt: addDays(end, 2) },
      },
    }),
  ]);
  const rotaHours = shifts.reduce((h, s) => h + shiftHours(s.start, s.end), 0);
  const clockedHours = entries
    .filter((e) => {
      const d = localDayISO(e.clockIn);
      return d >= startISO && d <= endISO;
    })
    .reduce((h, e) => h + entryHours(e), 0);
  return { rotaHours, clockedHours };
}

// --- Tool implementations -------------------------------------------------

async function toolListStaff() {
  const emps = await activeEmployees();
  return {
    staff: emps.map((e) => ({
      name: e.name,
      position: e.position ?? "Team",
      hourlyRate: e.hourlyRate,
      hourlyRateText: `${money(e.hourlyRate)}/hr`,
    })),
  };
}

type Resolved =
  | { ok: true; employee: EmpLite }
  | { ok: false; payload: unknown };

async function resolve(name: string): Promise<Resolved> {
  const emps = await activeEmployees();
  const matches = matchEmployees(emps, name);
  if (matches.length === 0)
    return {
      ok: false,
      payload: {
        error: `No active staff member matches "${name}".`,
        staff: emps.map((e) => e.name),
      },
    };
  if (matches.length > 1)
    return {
      ok: false,
      payload: {
        ambiguous: matches.map((e) => e.name),
        note: "Several people match — ask which one they mean.",
      },
    };
  return { ok: true, employee: matches[0]! };
}

async function toolWorkSummary(input: unknown) {
  const r = await resolve(str(input, "name"));
  if (!r.ok) return r.payload;
  const e = r.employee;
  const fromStr = str(input, "from");
  if (!ISO.test(fromStr))
    return { error: "Provide a start date as yyyy-mm-dd in `from`." };
  const start = parseDay(fromStr);
  const toStr = str(input, "to");
  const end = ISO.test(toStr) ? parseDay(toStr) : todayFn();
  const { rotaHours, clockedHours } = await workSummary(e, start, end);
  const rate = e.hourlyRate;
  return {
    employee: e.name,
    position: e.position ?? "Team",
    hourlyRate: rate,
    hourlyRateText: rate > 0 ? `${money(rate)}/hr` : "no hourly rate set",
    from: toISODate(start),
    to: toISODate(end),
    clocked: {
      hours: round1(clockedHours),
      pay: money(clockedHours * rate),
      note: "hours actually clocked in/out — use this for 'hours worked' / what is owed",
    },
    rota: {
      hours: round1(rotaHours),
      pay: money(rotaHours * rate),
      note: "hours scheduled on the rota (may differ from hours actually worked)",
    },
  };
}

async function toolPayments(input: unknown) {
  const r = await resolve(str(input, "name"));
  if (!r.ok) return r.payload;
  const e = r.employee;
  const fromStr = str(input, "from");
  const toStr = str(input, "to");
  const where: {
    category: string;
    employeeId: string;
    date?: { gte?: Date; lte?: Date };
  } = { category: "Wages", employeeId: e.id };
  if (ISO.test(fromStr) || ISO.test(toStr)) {
    where.date = {};
    if (ISO.test(fromStr)) where.date.gte = parseDay(fromStr);
    if (ISO.test(toStr)) where.date.lte = parseDay(toStr);
  }
  const rows = await prisma.expense.findMany({
    where,
    orderBy: { date: "desc" },
  });
  const total = rows.reduce((a, b) => a + b.amount, 0);
  const paidUpTo = rows.reduce<Date | null>(
    (max, p) => (p.periodEnd && (!max || p.periodEnd > max) ? p.periodEnd : max),
    null,
  );
  return {
    employee: e.name,
    paidUpTo: paidUpTo ? toISODate(paidUpTo) : null,
    paidUpToText: paidUpTo ? formatShort(paidUpTo) : "not paid yet",
    totalPaid: money(total),
    payments: rows.map((p) => ({
      amount: money(p.amount),
      paidOn: formatShort(p.date),
      paidUpTo: p.periodEnd ? formatShort(p.periodEnd) : null,
      note: p.note ?? null,
    })),
  };
}

async function toolIncomeSummary(input: unknown) {
  const fromStr = str(input, "from");
  if (!ISO.test(fromStr))
    return { error: "Provide a start date as yyyy-mm-dd in `from`." };
  const start = parseDay(fromStr);
  const toStr = str(input, "to");
  const end = ISO.test(toStr) ? parseDay(toStr) : todayFn();
  const [rows, rates] = await Promise.all([
    prisma.dailyIncome.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    getCommissionRates(),
  ]);
  const summary = sumIncome(rows);
  return {
    from: toISODate(start),
    to: toISODate(end),
    days: rows.length,
    total: money(summary.total),
    netAfterDeliveryFees: money(netIncome(summary, rates)),
    byChannel: CHANNELS.map((c) => ({
      channel: c.label,
      amount: money(summary[c.key]),
    })),
  };
}

async function runTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case "list_staff":
      return toolListStaff();
    case "get_work_summary":
      return toolWorkSummary(input);
    case "get_payments":
      return toolPayments(input);
    case "get_income_summary":
      return toolIncomeSummary(input);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "list_staff",
    description:
      "List active staff members with their position and hourly rate. Use to find the right person or check a rate.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_work_summary",
    description:
      "Hours a staff member clocked (actually worked) and was rota'd (scheduled) between two dates, with the pay each represents at their hourly rate. Use this for questions like 'how much do I owe X for the hours worked since <date>'. 'Hours worked' / amounts owed = the clocked figure.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff member's name, e.g. 'Sarina'." },
        from: { type: "string", description: "Start date, yyyy-mm-dd (inclusive)." },
        to: {
          type: "string",
          description: "End date, yyyy-mm-dd (inclusive). Omit for today.",
        },
      },
      required: ["name", "from"],
    },
  },
  {
    name: "get_payments",
    description:
      "Wage payments logged for a staff member: each amount, when it was paid, the date it covers up to ('paid up to'), and the latest paid-up-to date. Use to answer what has been paid, or to find the date to total hours from when asked 'since I last paid X'.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Staff member's name." },
        from: { type: "string", description: "Optional start date filter, yyyy-mm-dd." },
        to: { type: "string", description: "Optional end date filter, yyyy-mm-dd." },
      },
      required: ["name"],
    },
  },
  {
    name: "get_income_summary",
    description:
      "Total takings between two dates, split by channel (Z report, Cash, Tide, Just Eat, Uber Eats, Deliveroo), plus net after delivery fees. Use for questions about income/takings/sales.",
    input_schema: {
      type: "object",
      properties: {
        from: { type: "string", description: "Start date, yyyy-mm-dd (inclusive)." },
        to: {
          type: "string",
          description: "End date, yyyy-mm-dd (inclusive). Omit for today.",
        },
      },
      required: ["from"],
    },
  },
];

function systemPrompt(todayISO: string): string {
  return [
    "You are the assistant for the Rose restaurant's management portal.",
    `Today's date is ${todayISO}. Resolve relative dates ("June 9", "last week", "this month") to actual yyyy-mm-dd dates using today's date before calling tools.`,
    "Answer questions about staff hours, pay owed, wage payments, and takings.",
    "Always use the tools to get real figures — never estimate or invent numbers, names, rates, or dates.",
    "Money is GBP; the tools already format amounts with £.",
    'For "how much do I owe X for the hours (s)he worked", use get_work_summary and answer with the CLOCKED figure (hours actually worked × their rate). Mention the date range and that it is based on clocked hours.',
    'For "since I last paid X", call get_payments first to get their paid-up-to date, then get_work_summary from the day after that date.',
    "If a name matches more than one person, ask which one. If it matches nobody, say so.",
    "If a person has no hourly rate set, say their pay can't be calculated until a rate is added.",
    "Be concise and direct — usually one or two sentences. Do not show your reasoning or list the tool calls; just give the answer.",
  ].join("\n");
}

/** Run one assistant turn: Claude plans, calls data tools, and answers. */
export async function runAssistant(
  question: string,
  history: ChatTurn[] = [],
): Promise<AssistantResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error:
        "The AI assistant isn't switched on yet. Add an ANTHROPIC_API_KEY environment variable (Vercel → Settings → Environment Variables) and redeploy.",
    };
  }

  const client = new Anthropic({ apiKey });
  const system = systemPrompt(toISODate(todayFn()));
  const messages: Anthropic.MessageParam[] = [];
  for (const turn of history.slice(-8)) {
    if (turn.content?.trim()) messages.push({ role: turn.role, content: turn.content });
  }
  messages.push({ role: "user", content: question });

  try {
    for (let step = 0; step < 6; step++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system,
        tools: TOOLS,
        output_config: { effort: "low" },
        messages,
      });

      if (res.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: res.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of res.content) {
          if (block.type !== "tool_use") continue;
          let out: unknown;
          try {
            out = await runTool(block.name, block.input);
          } catch (e) {
            out = { error: e instanceof Error ? e.message : "lookup failed" };
          }
          results.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify(out),
          });
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("")
        .trim();
      return { ok: true, answer: text || "I couldn't work that out." };
    }
    return {
      ok: false,
      error: "That needed too many steps — try asking it a simpler way.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "request failed";
    return { ok: false, error: `Sorry, something went wrong: ${msg}` };
  }
}
