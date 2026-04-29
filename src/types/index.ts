import type { Category, Reminder, Expense, RecurrenceType, Priority, ReminderStatus, DigestFrequency, ExpenseType, ExpenseFrequency, ExpenseStatus } from "@prisma/client";

export type { RecurrenceType, Priority, ReminderStatus, DigestFrequency, ExpenseType, ExpenseFrequency, ExpenseStatus };
export type { Expense };

export type ReminderWithCategory = Reminder & {
  category: Category;
};

export type CategoryWithCount = Category & {
  _count: { reminders: number };
};

export interface UrgencyInfo {
  label: string;
  colorClass: string;
  bgClass: string;
  daysUntil: number | null;
}

export interface UpcomingGroup {
  label: string;
  reminders: ReminderWithCategory[];
}

export interface ExpenseSummary {
  totalMonthlyPersonal: number;
  totalMonthlyBusiness: number;
}
