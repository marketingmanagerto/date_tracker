import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { urgencyStyle, priorityStyle, formatDateShort } from "@/lib/utils";
import { daysUntilNext, recurrenceLabel } from "@/lib/rrule-helpers";
import type { ReminderWithCategory } from "@/types";
import { RefreshCw, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReminderCardProps {
  reminder: ReminderWithCategory;
}

export function ReminderCard({ reminder }: ReminderCardProps) {
  const days = daysUntilNext(reminder);
  const urgency = urgencyStyle(days);
  const priority = priorityStyle(reminder.priority);
  const recurrence = recurrenceLabel(reminder.recurrenceType, reminder.rruleString);
  const lastNotified = reminder.notificationLogs?.[0];

  return (
    <Link href={`/reminders/${reminder.id}`}>
      <div className={`bg-white dark:bg-gray-900 rounded-xl border hover:shadow-md transition-shadow p-4 h-full flex flex-col gap-3 ${urgency.borderClass}`}>
        <div className="flex items-start justify-between gap-2">
          <CategoryIcon category={reminder.category} size="sm" />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.pillClass}`}>
            {urgency.label}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2">
            {reminder.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{reminder.category.name}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{formatDateShort(reminder.date)}</span>
          <div className="flex items-center gap-1.5">
            {recurrence !== "One-time" && (
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            )}
            <Badge variant="secondary" className={`text-xs ${priority.class}`}>
              {priority.label}
            </Badge>
          </div>
        </div>
        {lastNotified && (
          <div className="flex items-center gap-1 -mt-1" title={`Last notified via ${lastNotified.type} on ${new Date(lastNotified.sentAt).toLocaleString()}`}>
            <BellRing className="h-3 w-3 text-indigo-400" />
            <span className="text-xs text-indigo-500 dark:text-indigo-400">
              Notified {formatDistanceToNow(new Date(lastNotified.sentAt), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
