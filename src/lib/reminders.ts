import { prisma } from "./prisma";
import { getNextOccurrence, daysUntilNext } from "./rrule-helpers";
import type { ReminderWithCategory, UpcomingGroup } from "@/types";
import { startOfDay, endOfDay, addDays } from "date-fns";

export async function getUpcomingReminders(userId: string, days = 30): Promise<ReminderWithCategory[]> {
  const reminders = await prisma.reminder.findMany({
    where: { userId, status: "ACTIVE" },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const today = startOfDay(new Date());
  const cutoff = addDays(today, days);

  return reminders
    .filter((r) => {
      const next = getNextOccurrence(r, today);
      if (!next) return false;
      return next <= cutoff;
    })
    .sort((a, b) => {
      const na = getNextOccurrence(a, today);
      const nb = getNextOccurrence(b, today);
      if (!na || !nb) return 0;
      return na.getTime() - nb.getTime();
    });
}

export async function getOverdueReminders(userId: string): Promise<ReminderWithCategory[]> {
  const reminders = await prisma.reminder.findMany({
    where: { userId, status: "ACTIVE" },
    include: { category: true },
  });

  return reminders.filter((r) => {
    const days = daysUntilNext(r);
    return days !== null && days < 0;
  });
}

export async function getTodayReminders(userId: string): Promise<ReminderWithCategory[]> {
  const reminders = await prisma.reminder.findMany({
    where: { userId, status: "ACTIVE" },
    include: { category: true },
  });

  return reminders.filter((r) => {
    const days = daysUntilNext(r);
    return days === 0;
  });
}

export async function getDueForNotification(userId: string): Promise<ReminderWithCategory[]> {
  const reminders = await prisma.reminder.findMany({
    where: { userId, status: "ACTIVE" },
    include: { category: true },
  });

  return reminders.filter((r) => {
    const days = daysUntilNext(r);
    if (days === null) return false;
    return days >= 0 && days <= r.advanceDays;
  });
}

export function groupUpcoming(reminders: ReminderWithCategory[]): UpcomingGroup[] {
  const today = startOfDay(new Date());
  const thisWeekEnd = endOfDay(addDays(today, 7));
  const nextWeekEnd = endOfDay(addDays(today, 14));

  const groups: UpcomingGroup[] = [
    { label: "This Week", reminders: [] },
    { label: "Next Week", reminders: [] },
    { label: "Later This Month", reminders: [] },
  ];

  for (const r of reminders) {
    const next = getNextOccurrence(r, today);
    if (!next) continue;
    if (next <= thisWeekEnd) {
      groups[0].reminders.push(r);
    } else if (next <= nextWeekEnd) {
      groups[1].reminders.push(r);
    } else {
      groups[2].reminders.push(r);
    }
  }

  return groups.filter((g) => g.reminders.length > 0);
}
