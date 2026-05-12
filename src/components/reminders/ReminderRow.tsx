import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { Badge } from "@/components/ui/badge";
import { urgencyStyle, priorityStyle, formatDateShort } from "@/lib/utils";
import { daysUntilNext, recurrenceLabel } from "@/lib/rrule-helpers";
import type { ReminderWithCategory } from "@/types";
import { RefreshCw, ChevronRight, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ReminderRowProps {
  reminder: ReminderWithCategory;
}

export function ReminderRow({ reminder }: ReminderRowProps) {
  const days = daysUntilNext(reminder);
  const urgency = urgencyStyle(days);
  const priority = priorityStyle(reminder.priority);
  const recurrence = recurrenceLabel(reminder.recurrenceType, reminder.rruleString);
  const lastNotified = reminder.notificationLogs?.[0];

  return (
    <Link href={`/reminders/${reminder.id}`}>
      <div className={`bg-white dark:bg-gray-900 rounded-lg border hover:shadow-sm transition-shadow flex items-center gap-3 p-3 ${urgency.borderClass}`}>
        <CategoryIcon category={reminder.category} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{reminder.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{reminder.category.name}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{formatDateShort(reminder.date)}</span>
            {recurrence !== "One-time" && (
              <span className="hidden sm:contents">
                <span className="text-muted-foreground">·</span>
                <RefreshCw className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{recurrence}</span>
              </span>
            )}
            {lastNotified && (
              <span className="hidden sm:contents">
                <span className="text-muted-foreground">·</span>
                <BellRing className="h-3 w-3 text-indigo-400" />
                <span className="text-xs text-indigo-500 dark:text-indigo-400" title={`Last notified via ${lastNotified.type} on ${new Date(lastNotified.sentAt).toLocaleString()}`}>
                  {formatDistanceToNow(new Date(lastNotified.sentAt), { addSuffix: true })}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={`hidden sm:inline-flex text-xs ${priority.class}`}>{priority.label}</Badge>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgency.pillClass}`}>
            {urgency.label}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}
