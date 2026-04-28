import type { Category, Reminder, RecurrenceType, Priority, ReminderStatus, DigestFrequency } from "@prisma/client";

export type { RecurrenceType, Priority, ReminderStatus, DigestFrequency };

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
