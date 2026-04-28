import type { UpcomingGroup } from "@/types";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";
import { urgencyStyle, formatDateShort } from "@/lib/utils";
import { daysUntilNext } from "@/lib/rrule-helpers";
import Link from "next/link";

interface UpcomingListProps {
  groups: UpcomingGroup[];
}

export function UpcomingList({ groups }: UpcomingListProps) {
  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border px-5 py-8 text-center text-muted-foreground">
        <p className="text-3xl mb-2">✅</p>
        <p className="text-sm font-medium">Nothing coming up in the next 30 days</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <span className="text-xl">🗓️</span>
        <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming</h3>
        <span className="text-xs text-muted-foreground ml-1">next 30 days</span>
      </div>
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-5 py-2 bg-muted/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</p>
          </div>
          <div className="divide-y">
            {group.reminders.map((r) => {
              const days = daysUntilNext(r);
              const urgency = urgencyStyle(days);
              return (
                <Link key={r.id} href={`/reminders/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
                  <CategoryIcon category={r.category} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.category.name} · {formatDateShort(r.date)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${urgency.pillClass}`}>
                    {urgency.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
