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

/**
 * Hours of a same-day shift that have already happened by `now` ("HH:mm").
 * 0 before the shift starts, the full length once it has ended; overnight
 * shifts count up until midnight's wrap (end < start rolls to the next day).
 */
export function elapsedShiftHours(start: string, end: string, now: string): number {
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return Number.isNaN(h) || Number.isNaN(m) ? NaN : h * 60 + m;
  };
  const s = toMins(start);
  const n = toMins(now);
  let e = toMins(end);
  if ([s, e, n].some(Number.isNaN)) return 0;
  if (e <= s) e += 24 * 60; // crossed midnight
  const mins = Math.max(0, Math.min(n, e) - s);
  return Math.round((mins / 60) * 100) / 100;
}

export type IncomeLike = {
  zReport: number;
  cash: number;
  tide: number;
  justEat: number;
  uberEats: number;
  deliveroo: number;
};

export function incomeTotal(i: IncomeLike): number {
  return i.zReport + i.cash + i.tide + i.justEat + i.uberEats + i.deliveroo;
}

export const CHANNELS = [
  { key: "zReport", label: "Z report", color: "#37c97e" },
  { key: "cash", label: "Cash", color: "#a3e635" },
  { key: "tide", label: "Tide", color: "#6366f1" },
  { key: "justEat", label: "Just Eat", color: "#f59e0b" },
  { key: "uberEats", label: "Uber Eats", color: "#0a0a0a" },
  { key: "deliveroo", label: "Deliveroo", color: "#22d3ee" },
] as const;

export function sumIncome(rows: IncomeLike[]): IncomeLike & { total: number } {
  const acc = rows.reduce(
    (a, r) => {
      a.zReport += r.zReport;
      a.cash += r.cash;
      a.tide += r.tide;
      a.justEat += r.justEat;
      a.uberEats += r.uberEats;
      a.deliveroo += r.deliveroo;
      return a;
    },
    { zReport: 0, cash: 0, tide: 0, justEat: 0, uberEats: 0, deliveroo: 0 },
  );
  return { ...acc, total: incomeTotal(acc) };
}

export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

/** Net income after deducting delivery commission (rates are fractions 0–1). */
export function netIncome(
  i: IncomeLike,
  rates: { justEat: number; uberEats: number; deliveroo: number },
): number {
  return (
    i.zReport +
    i.cash +
    i.tide +
    i.justEat * (1 - rates.justEat) +
    i.uberEats * (1 - rates.uberEats) +
    i.deliveroo * (1 - rates.deliveroo)
  );
}
