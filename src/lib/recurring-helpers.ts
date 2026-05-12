import { addHours, addDays, addWeeks, addMonths, addYears } from "date-fns";

export function computeNextFireAt(from: Date, interval: string, value: number): Date {
  switch (interval) {
    case "HOURLY":  return addHours(from, value);
    case "DAILY":   return addDays(from, value);
    case "WEEKLY":  return addWeeks(from, value);
    case "MONTHLY": return addMonths(from, value);
    case "YEARLY":  return addYears(from, value);
    default:        return addDays(from, value);
  }
}

export const INTERVAL_LABELS: Record<string, string> = {
  HOURLY:  "hourly",
  DAILY:   "daily",
  WEEKLY:  "weekly",
  MONTHLY: "monthly",
  YEARLY:  "yearly",
};

export function intervalLabel(interval: string, value: number): string {
  const unit = INTERVAL_LABELS[interval] ?? interval.toLowerCase();
  if (value === 1) return unit.charAt(0).toUpperCase() + unit.slice(1);
  const singular = {
    HOURLY: "hour", DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year",
  }[interval] ?? unit;
  return `Every ${value} ${singular}s`;
}
