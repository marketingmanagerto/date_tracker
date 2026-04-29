"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { getOccurrencesInRange } from "@/lib/rrule-helpers";
import type { ReminderWithCategory } from "@/types";
import type { Expense } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";
import { CategoryIcon } from "@/components/reminders/CategoryIcon";
import { FREQUENCY_LABELS } from "@/lib/expenses";

interface CalendarViewProps {
  reminders: ReminderWithCategory[];
  expenses?: Expense[];
}

export function CalendarView({ reminders, expenses = [] }: CalendarViewProps) {
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

  function getExpensesForDay(day: Date): Expense[] {
    return expenses.filter((e) =>
      e.status === "ACTIVE" && isSameDay(new Date(e.nextDueDate), day)
    );
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
          const dayExpenses  = getExpensesForDay(day);
          const totalItems   = dayReminders.length + dayExpenses.length;
          const inMonth      = isSameMonth(day, month);
          const today        = isToday(day);
          const maxShow      = 3;
          const reminderShow = Math.min(dayReminders.length, maxShow);
          const expenseSlots = maxShow - reminderShow;
          const expenseShow  = Math.min(dayExpenses.length, expenseSlots);

          return (
            <div
              key={i}
              className={`min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 border-b border-r last:border-r-0 ${
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

              <div className="mt-1 space-y-0.5">
                {/* Reminder items */}
                {dayReminders.slice(0, reminderShow).map((r) => (
                  <Popover key={r.id}>
                    <PopoverTrigger
                      className="w-full text-left text-xs px-1.5 py-0.5 rounded hover:opacity-80 flex items-center gap-1"
                      style={{ backgroundColor: `${r.category.color}22`, color: r.category.color }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: r.category.color }} />
                      <span className="truncate">{r.title}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="flex items-start gap-2">
                        <CategoryIcon category={r.category} size="sm" />
                        <div>
                          <p className="font-semibold text-sm">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.category.name}</p>
                        </div>
                      </div>
                      <Link href={`/reminders/${r.id}`} className="mt-3 block text-xs text-indigo-600 hover:underline dark:text-indigo-400">
                        View reminder →
                      </Link>
                    </PopoverContent>
                  </Popover>
                ))}

                {/* Expense items */}
                {dayExpenses.slice(0, expenseShow).map((e) => (
                  <Popover key={e.id}>
                    <PopoverTrigger className="w-full text-left text-xs px-1.5 py-0.5 rounded hover:opacity-80 flex items-center gap-1 bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400">
                      <Receipt className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{e.name}</span>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{e.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ${Number(e.amount).toFixed(2)} · {FREQUENCY_LABELS[e.frequency]}
                          </p>
                          <p className="text-xs text-muted-foreground">{e.card}</p>
                        </div>
                      </div>
                      <Link href="/expenses" className="mt-3 block text-xs text-teal-600 hover:underline dark:text-teal-400">
                        View expenses →
                      </Link>
                    </PopoverContent>
                  </Popover>
                ))}

                {/* Overflow count */}
                {totalItems > maxShow && (
                  <p className="text-xs text-muted-foreground px-1.5">+{totalItems - maxShow} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
