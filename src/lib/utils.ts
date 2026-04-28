import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, differenceInCalendarDays, startOfDay } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, fmt = "PPP"): string {
  return format(new Date(date), fmt);
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function daysUntil(date: Date | string): number {
  return differenceInCalendarDays(startOfDay(new Date(date)), startOfDay(new Date()));
}

export function formatRelative(date: Date | string): string {
  const d = differenceInCalendarDays(startOfDay(new Date(date)), startOfDay(new Date()));
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d === -1) return "Yesterday";
  if (d < 0) return `${Math.abs(d)} days ago`;
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export interface UrgencyStyle {
  label: string;
  pillClass: string;
  borderClass: string;
  textClass: string;
}

export function urgencyStyle(days: number | null): UrgencyStyle {
  if (days === null) return { label: "Unknown", pillClass: "bg-muted text-muted-foreground", borderClass: "border-l-4 border-l-muted", textClass: "text-muted-foreground" };
  if (days < 0) return { label: "Overdue", pillClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", borderClass: "border-l-4 border-l-red-600", textClass: "text-red-600" };
  if (days === 0) return { label: "Today!", pillClass: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", borderClass: "border-l-4 border-l-red-500", textClass: "text-red-500" };
  if (days <= 3) return { label: `${days}d`, pillClass: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", borderClass: "border-l-4 border-l-orange-500", textClass: "text-orange-500" };
  if (days <= 7) return { label: `${days}d`, pillClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300", borderClass: "border-l-4 border-l-amber-400", textClass: "text-amber-500" };
  if (days <= 14) return { label: `${days}d`, pillClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300", borderClass: "border-l-4 border-l-blue-500", textClass: "text-blue-500" };
  return { label: `${days}d`, pillClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300", borderClass: "border-l-4 border-l-green-500", textClass: "text-green-500" };
}

export function priorityStyle(priority: string) {
  switch (priority) {
    case "HIGH": return { label: "High", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" };
    case "LOW": return { label: "Low", class: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
    default: return { label: "Medium", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" };
  }
}
