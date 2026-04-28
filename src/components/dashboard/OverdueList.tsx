import type { ReminderWithCategory } from "@/types";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";
import { daysUntilNext } from "@/lib/rrule-helpers";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface OverdueListProps {
  reminders: ReminderWithCategory[];
}

export function OverdueList({ reminders }: OverdueListProps) {
  if (reminders.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/30">
      <div className="px-5 py-4 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2 bg-red-50 dark:bg-red-950/20 rounded-t-xl">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <h3 className="font-semibold text-red-700 dark:text-red-400">Needs Attention</h3>
        <span className="ml-auto text-xs bg-red-200 text-red-800 dark:bg-red-800/40 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
          {reminders.length}
        </span>
      </div>
      <div className="divide-y divide-red-100 dark:divide-red-900/20">
        {reminders.map((r) => {
          const days = daysUntilNext(r);
          const overdueDays = days !== null ? Math.abs(days) : null;
          return (
            <Link key={r.id} href={`/reminders/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-colors">
              <CategoryIcon category={r.category} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.category.name}</p>
              </div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400 shrink-0">
                {overdueDays ? `${overdueDays}d ago` : "Overdue"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
