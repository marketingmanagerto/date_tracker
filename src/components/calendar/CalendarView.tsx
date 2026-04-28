"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { getOccurrencesInRange } from "@/lib/rrule-helpers";
import type { ReminderWithCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";

interface CalendarViewProps {
  reminders: ReminderWithCategory[];
}

export function CalendarView({ reminders }: CalendarViewProps) {
  const [month, setMonth] = useState(new Date());

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  function getRemindersForDay(day: Date): ReminderWithCategory[] {
    return reminders.filter((r) => {
      const occurrences = getOccurrencesInRange(r, day, day);
      return occurrences.length > 0;
    });
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth(subMonths(month, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayReminders = getRemindersForDay(day);
          const inMonth = isSameMonth(day, month);
          const today = isToday(day);

          return (
            <div
              key={i}
              className={`min-h-[80px] p-1.5 border-b border-r last:border-r-0 ${
                !inMonth ? "bg-muted/30" : ""
              } ${i % 7 === 0 ? "border-l-0" : ""}`}
            >
              <span className={`text-sm font-medium flex items-center justify-center h-6 w-6 rounded-full ${
                today
                  ? "bg-indigo-600 text-white"
                  : inMonth
                  ? "text-gray-900 dark:text-white"
                  : "text-muted-foreground"
              }`}>
                {format(day, "d")}
              </span>

              {dayReminders.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayReminders.slice(0, 3).map((r) => (
                    <Popover key={r.id}>
                      <PopoverTrigger
                        className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80"
                        style={{ backgroundColor: `${r.category.color}22`, color: r.category.color }}
                      >
                        {r.category.icon} {r.title}
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" align="start">
                        <div className="flex items-start gap-2">
                          <CategoryIcon category={r.category} size="sm" />
                          <div>
                            <p className="font-semibold text-sm">{r.title}</p>
                            <p className="text-xs text-muted-foreground">{r.category.name}</p>
                          </div>
                        </div>
                        <Link
                          href={`/reminders/${r.id}`}
                          className="mt-3 block text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          View reminder →
                        </Link>
                      </PopoverContent>
                    </Popover>
                  ))}
                  {dayReminders.length > 3 && (
                    <p className="text-xs text-muted-foreground px-1.5">+{dayReminders.length - 3} more</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
