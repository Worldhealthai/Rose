// Date helpers. Trading days and shift days are stored at UTC midnight so a
// calendar day always maps to one row regardless of timezone.

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** A UTC-midnight Date for the given y/m/d (month is 0-based). */
export function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

/** Strip a date to UTC midnight. */
export function startOfDay(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Today at UTC midnight. */
export function today(): Date {
  return startOfDay(new Date());
}

/** Parse a yyyy-mm-dd string to a UTC-midnight Date. Falls back to today. */
export function parseDay(value?: string | null): Date {
  if (value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (m) return utcDate(+m[1], +m[2] - 1, +m[3]);
  }
  return today();
}

/** Format a Date as yyyy-mm-dd (UTC). */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + days);
  return r;
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayIndex(d: Date): number {
  return (d.getUTCDay() + 6) % 7;
}

/** Monday (UTC midnight) of the week containing d. */
export function startOfWeek(d: Date): Date {
  return addDays(startOfDay(d), -weekdayIndex(d));
}

/** The 7 days (Mon..Sun) of the week containing d. */
export function weekDays(d: Date): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function startOfMonth(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
}

export function addMonths(d: Date, months: number): Date {
  return utcDate(d.getUTCFullYear(), d.getUTCMonth() + months, 1);
}

const dayFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const longDayFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const monthFmt = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// Wall-clock formats in the restaurant's timezone (servers run in UTC).
export const RESTAURANT_TZ = "Europe/London";
const clockFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: RESTAURANT_TZ,
});
const chatTimeFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: RESTAURANT_TZ,
});
const londonDayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: RESTAURANT_TZ,
}); // yyyy-mm-dd

/** "14:05" in restaurant local time. */
export const formatClock = (d: Date) => clockFmt.format(d);
/** "Mon 14:05" in restaurant local time. */
export const formatChatTime = (d: Date) => chatTimeFmt.format(d);
/** The restaurant-local calendar date (yyyy-mm-dd) a timestamp falls on. */
export const localDayISO = (d: Date) => londonDayFmt.format(d);

export const formatDay = (d: Date) => dayFmt.format(d);
export const formatLongDay = (d: Date) => longDayFmt.format(d);
export const formatMonth = (d: Date) => monthFmt.format(d);
export const formatShort = (d: Date) => shortFmt.format(d);

export function isSameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/** "Today", "Tomorrow", "Yesterday", or a short date. */
export function relativeDay(d: Date): string {
  const t = today();
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatDay(d);
}
