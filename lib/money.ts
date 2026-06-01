// Currency formatting. UK pounds by default (Z report / Just Eat / Deliveroo
// context). To change currency, edit CURRENCY + LOCALE here.
const LOCALE = "en-GB";
const CURRENCY = "GBP";
export const CURRENCY_SYMBOL = "£";

const fmt = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const fmtCompact = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export function money(amount: number | null | undefined): string {
  return fmt.format(amount ?? 0);
}

/** Whole-pound formatting, e.g. for big dashboard numbers. */
export function moneyCompact(amount: number | null | undefined): string {
  return fmtCompact.format(amount ?? 0);
}

/** Parse a money string from a form into a number (>= 0). */
export function parseMoney(value: FormDataEntryValue | null): number {
  if (value == null) return 0;
  const n = parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
  if (!isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}
