import type { Expense } from "@prisma/client";

/** Convert any expense amount to monthly equivalent for summary totals */
export function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case "DAILY":     return amount * 30.44;
    case "WEEKLY":    return amount * 4.33;
    case "MONTHLY":   return amount;
    case "QUARTERLY": return amount / 3;
    case "YEARLY":    return amount / 12;
    case "ONE_TIME":  return 0;
    default:          return amount;
  }
}

export function expenseSummary(expenses: Expense[]) {
  const active = expenses.filter((e) => e.status === "ACTIVE");
  const personal = active.filter((e) => e.type === "PERSONAL");
  const business = active.filter((e) => e.type === "BUSINESS");

  const sum = (list: Expense[]) =>
    list.reduce((acc, e) => acc + toMonthlyAmount(Number(e.amount), e.frequency), 0);

  return {
    totalMonthlyPersonal: sum(personal),
    totalMonthlyBusiness: sum(business),
    totalMonthly: sum(active),
  };
}

export const FREQUENCY_LABELS: Record<string, string> = {
  DAILY:     "Daily",
  WEEKLY:    "Weekly",
  MONTHLY:   "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY:    "Yearly",
  ONE_TIME:  "One-time",
};

export const EXPENSE_CATEGORIES = [
  "Software / SaaS",
  "Streaming",
  "Cloud / Hosting",
  "Utilities",
  "Insurance",
  "Rent / Lease",
  "Subscriptions",
  "Marketing",
  "Banking / Finance",
  "Phone / Internet",
  "Transport",
  "Food & Drink",
  "Health & Wellness",
  "Education",
  "Other",
] as const;
