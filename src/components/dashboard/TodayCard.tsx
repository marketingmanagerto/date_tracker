import type { ReminderWithCategory } from "@/types";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";

interface TodayCardProps {
  reminders: ReminderWithCategory[];
}

export function TodayCard({ reminders }: TodayCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Today</h3>
        {reminders.length > 0 && (
          <span className="ml-auto text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full font-medium">
            {reminders.length}
          </span>
        )}
      </div>
      {reminders.length === 0 ? (
        <div className="px-5 py-8 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-indigo-300 dark:text-indigo-700" />
          <p className="text-sm font-medium">Nothing today — enjoy your day!</p>
        </div>
      ) : (
        <div className="divide-y">
          {reminders.map((r) => (
            <Link key={r.id} href={`/reminders/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors">
              <CategoryIcon category={r.category} size="sm" />
              <div>
                <p className="font-medium text-sm text-gray-900 dark:text-white">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.category.name}</p>
              </div>
              <span className="ml-auto text-xs font-bold text-red-600 dark:text-red-400">Today!</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
