import "server-only";
import { prisma } from "./prisma";

export type CommissionRates = {
  justEat: number; // fraction, e.g. 0.3 for 30%
  uberEats: number;
  deliveroo: number;
};

export const COMMISSION_KEYS = {
  justEat: "commissionJustEat",
  uberEats: "commissionUberEats",
  deliveroo: "commissionDeliveroo",
} as const;

/** Delivery commission percentages (as fractions). Default 0 until set. */
export async function getCommissionRates(): Promise<CommissionRates> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: Object.values(COMMISSION_KEYS) } },
  });
  const map = new Map(rows.map((r) => [r.key, parseFloat(r.value)]));
  const frac = (key: string) => {
    const v = map.get(key);
    return v && isFinite(v) && v >= 0 && v <= 100 ? v / 100 : 0;
  };
  return {
    justEat: frac(COMMISSION_KEYS.justEat),
    uberEats: frac(COMMISSION_KEYS.uberEats),
    deliveroo: frac(COMMISSION_KEYS.deliveroo),
  };
}

export const EXPENSE_CATEGORIES = ["Stock", "Wages", "Rent", "Bills", "Other"];
