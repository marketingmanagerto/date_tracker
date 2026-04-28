import { RRule, RRuleSet } from "rrule";
import { startOfDay, addDays } from "date-fns";
import type { Reminder, RecurrenceType } from "@prisma/client";

function buildRRule(reminder: Pick<Reminder, "date" | "recurrenceType" | "rruleString">): RRule | null {
  const dtstart = startOfDay(new Date(reminder.date));

  switch (reminder.recurrenceType) {
    case "YEARLY":
      return new RRule({ freq: RRule.YEARLY, dtstart });
    case "MONTHLY":
      return new RRule({ freq: RRule.MONTHLY, dtstart });
    case "WEEKLY":
      return new RRule({ freq: RRule.WEEKLY, dtstart });
    case "CUSTOM":
      if (!reminder.rruleString) return null;
      try {
        return RRule.fromString(reminder.rruleString);
      } catch {
        return null;
      }
    default:
      return null;
  }
}

export function getNextOccurrence(
  reminder: Pick<Reminder, "date" | "recurrenceType" | "rruleString">,
  from: Date = new Date()
): Date | null {
  const fromDay = startOfDay(from);

  if (reminder.recurrenceType === "NONE") {
    const d = startOfDay(new Date(reminder.date));
    return d >= fromDay ? d : null;
  }

  const rule = buildRRule(reminder);
  if (!rule) return null;

  // after() is exclusive so subtract 1ms to include today
  const next = rule.after(addDays(fromDay, -1), true);
  return next ?? null;
}

export function getOccurrencesInRange(
  reminder: Pick<Reminder, "date" | "recurrenceType" | "rruleString">,
  start: Date,
  end: Date
): Date[] {
  const startDay = startOfDay(start);
  const endDay = startOfDay(end);

  if (reminder.recurrenceType === "NONE") {
    const d = startOfDay(new Date(reminder.date));
    return d >= startDay && d <= endDay ? [d] : [];
  }

  const rule = buildRRule(reminder);
  if (!rule) return [];

  return rule.between(startDay, endDay, true);
}

export function daysUntilNext(
  reminder: Pick<Reminder, "date" | "recurrenceType" | "rruleString">
): number | null {
  const next = getNextOccurrence(reminder);
  if (!next) return null;
  const today = startOfDay(new Date());
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export function recurrenceLabel(recurrenceType: RecurrenceType, rruleString?: string | null): string {
  switch (recurrenceType) {
    case "YEARLY": return "Every year";
    case "MONTHLY": return "Every month";
    case "WEEKLY": return "Every week";
    case "CUSTOM":
      if (rruleString) {
        try {
          return RRule.fromString(rruleString).toText();
        } catch {
          return "Custom";
        }
      }
      return "Custom";
    default:
      return "One-time";
  }
}

export function buildRRuleStringFromType(type: RecurrenceType, date: Date): string | undefined {
  const dtstart = startOfDay(date);
  switch (type) {
    case "YEARLY":
      return new RRule({ freq: RRule.YEARLY, dtstart }).toString();
    case "MONTHLY":
      return new RRule({ freq: RRule.MONTHLY, dtstart }).toString();
    case "WEEKLY":
      return new RRule({ freq: RRule.WEEKLY, dtstart }).toString();
    default:
      return undefined;
  }
}
