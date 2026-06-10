// Time-clock (check in / check out) calculations.

export type TimeEntryLike = { clockIn: Date; clockOut: Date | null };

/** Hours covered by one entry; open entries count up to `now`. */
export function entryHours(e: TimeEntryLike, now = new Date()): number {
  const end = e.clockOut ?? now;
  const ms = end.getTime() - e.clockIn.getTime();
  if (ms <= 0) return 0;
  return ms / 3_600_000;
}

export function sumEntryHours(entries: TimeEntryLike[], now = new Date()): number {
  return entries.reduce((h, e) => h + entryHours(e, now), 0);
}

/** Format hours like "7.4h". */
export function fmtHours(h: number): string {
  return `${(Math.round(h * 10) / 10).toFixed(1)}h`;
}
