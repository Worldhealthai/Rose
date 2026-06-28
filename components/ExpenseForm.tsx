"use client";

import { useState } from "react";
import { RefreshForm, SubmitButton } from "./forms";
import { CURRENCY_SYMBOL } from "@/lib/money";
import { createExpense } from "@/app/admin/expenses/actions";

// Each category asks for its detail in its own words; the answer is stored as
// the expense's name (the `note`).
const CATEGORIES = [
  { value: "Salary", detail: "Who's it for?", placeholder: "e.g. Ali — June salary" },
  {
    value: "Stock",
    detail: "What kind of stock?",
    placeholder: "e.g. Meat, Vegetables, Drinks",
  },
  {
    value: "Bills",
    detail: "Type of bill",
    placeholder: "e.g. Rent, Business rates, Electricity",
  },
  { value: "Other", detail: "What's it for?", placeholder: "e.g. Repairs, Cleaning" },
] as const;

const FALLBACK = { detail: "What's it for?", placeholder: "e.g. Repairs" };

export function ExpenseForm({ defaultMonth }: { defaultMonth: string }) {
  const [category, setCategory] = useState<string>("Salary");
  const cfg = CATEGORIES.find((c) => c.value === category) ?? FALLBACK;

  return (
    <RefreshForm action={createExpense} className="space-y-3" resetOnSuccess>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label">Category</label>
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{cfg.detail}</label>
          <input
            name="note"
            className="input"
            placeholder={cfg.placeholder}
            required
          />
        </div>
        <div>
          <label className="label">Amount ({CURRENCY_SYMBOL})</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
              {CURRENCY_SYMBOL}
            </span>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              className="input pl-8"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Month</label>
          <input
            name="month"
            type="month"
            defaultValue={defaultMonth}
            className="input"
            required
          />
        </div>
      </div>
      <SubmitButton savedLabel="Added ✓">Add expense</SubmitButton>
    </RefreshForm>
  );
}
