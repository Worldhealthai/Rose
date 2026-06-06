import "server-only";
import { prisma } from "./prisma";
import {
  addDays,
  endOfMonth,
  startOfMonth,
  startOfWeek,
  today as todayFn,
  toISODate,
  weekDays,
} from "./dates";
import { incomeTotal, shiftHours, sumIncome, pct, netIncome } from "./calc";
import { getCommissionRates } from "./settings";

const ZERO = { zReport: 0, justEat: 0, uberEats: 0, deliveroo: 0 };

export async function getDashboardData() {
  const today = todayFn();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const week = weekDays(today);
  const weekStart = week[0];
  const weekEnd = week[6];
  const trendStart = addDays(today, -29);
  const fetchStart = [monthStart, trendStart, weekStart].reduce((a, b) =>
    a < b ? a : b,
  );

  const [
    incomes,
    weekShifts,
    activeStaff,
    suppliers,
    productsNeeded,
    tasksActive,
    tasksDoneToday,
    rates,
    expenseAgg,
  ] = await Promise.all([
    prisma.dailyIncome.findMany({
      where: { date: { gte: fetchStart, lte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.shift.findMany({
      where: { date: { gte: weekStart, lte: weekEnd } },
      include: { employee: true },
      orderBy: { start: "asc" },
    }),
    prisma.employee.count({ where: { active: true } }),
    prisma.supplier.count(),
    prisma.product.count({ where: { needed: true } }),
    prisma.task.count({ where: { active: true } }),
    prisma.taskCompletion.count({ where: { date: today } }),
    getCommissionRates(),
    prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: monthStart, lte: monthEnd } },
    }),
  ]);

  const byDay = new Map(incomes.map((i) => [toISODate(i.date), i]));
  const get = (d: Date) => byDay.get(toISODate(d)) ?? ZERO;

  const todayIncome = get(today);
  const monthRows = incomes.filter(
    (i) => i.date >= monthStart && i.date <= monthEnd,
  );
  const weekRows = week.map(get);

  const todayTotal = incomeTotal(todayIncome);
  const weekSum = sumIncome(weekRows);
  const monthSum = sumIncome(monthRows);
  const monthNet = monthRows.reduce((s, r) => s + netIncome(r, rates), 0);
  const monthExpenses = expenseAgg._sum.amount ?? 0;
  const monthProfit = monthNet - monthExpenses;

  // 30-day trend
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = addDays(today, -29 + i);
    return { date: d, value: incomeTotal(get(d)) };
  });

  // Labour cost for the current week (assigned shifts only).
  let weekHours = 0;
  let weekLabour = 0;
  for (const s of weekShifts) {
    const h = shiftHours(s.start, s.end);
    weekHours += h;
    if (s.employee) weekLabour += h * s.employee.hourlyRate;
  }

  const todayKey = toISODate(today);
  const todayShifts = weekShifts.filter((s) => toISODate(s.date) === todayKey);

  // Best & average day this month
  const totalsThisMonth = monthRows.map(incomeTotal);
  const bestDay =
    monthRows.length > 0
      ? monthRows.reduce((a, b) => (incomeTotal(b) > incomeTotal(a) ? b : a))
      : null;
  const avgDay =
    totalsThisMonth.length > 0
      ? monthSum.total / totalsThisMonth.length
      : 0;

  return {
    today,
    todayIncome,
    todayTotal,
    weekSum,
    monthSum,
    monthNet,
    monthExpenses,
    monthProfit,
    monthLabel: monthStart,
    trend,
    weekHours,
    weekLabour,
    weekLabourPct: pct(weekLabour, weekSum.total),
    todayShifts,
    counts: {
      activeStaff,
      suppliers,
      productsNeeded,
      tasksTotal: tasksActive,
      tasksOpen: Math.max(0, tasksActive - tasksDoneToday),
    },
    bestDay: bestDay
      ? { date: bestDay.date, total: incomeTotal(bestDay) }
      : null,
    avgDay,
    daysRecorded: monthRows.length,
    hasAnyIncome: incomes.length > 0,
  };
}
