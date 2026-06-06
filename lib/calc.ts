// Shift / labour / income calculations.

/** Hours between two "HH:mm" times. Handles overnight (end < start). */
export function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // crossed midnight
  return Math.round((mins / 60) * 100) / 100;
}

export type IncomeLike = {
  zReport: number;
  justEat: number;
  uberEats: number;
  deliveroo: number;
};

export function incomeTotal(i: IncomeLike): number {
  return i.zReport + i.justEat + i.uberEats + i.deliveroo;
}

export const CHANNELS = [
  { key: "zReport", label: "Z report", color: "#37c97e" },
  { key: "justEat", label: "Just Eat", color: "#f59e0b" },
  { key: "uberEats", label: "Uber Eats", color: "#0a0a0a" },
  { key: "deliveroo", label: "Deliveroo", color: "#22d3ee" },
] as const;

export function sumIncome(rows: IncomeLike[]): IncomeLike & { total: number } {
  const acc = rows.reduce(
    (a, r) => {
      a.zReport += r.zReport;
      a.justEat += r.justEat;
      a.uberEats += r.uberEats;
      a.deliveroo += r.deliveroo;
      return a;
    },
    { zReport: 0, justEat: 0, uberEats: 0, deliveroo: 0 },
  );
  return { ...acc, total: incomeTotal(acc) };
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}
