import type { Expense } from "@prisma/client";
import { differenceInCalendarDays, startOfDay, format } from "date-fns";
import { Receipt, CreditCard, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { urgencyStyle } from "@/lib/utils";

interface UpcomingBillsProps {
  expenses: Expense[];
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n);
}

export function UpcomingBills({ expenses }: UpcomingBillsProps) {
  const upcoming = expenses
    .filter((e) => {
      if (e.status !== "ACTIVE") return false;
      const days = differenceInCalendarDays(
        startOfDay(new Date(e.nextDueDate)),
        startOfDay(new Date())
      );
      return days >= 0 && days <= 14;
    })
    .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  if (upcoming.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border px-5 py-8 text-center text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400 dark:text-green-700" />
        <p className="text-sm font-medium">No bills due in the next 14 days</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Receipt className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Bills</h3>
        <span className="text-xs text-muted-foreground ml-1">next 14 days</span>
      </div>
      <div className="divide-y">
        {upcoming.map((e) => {
          const days    = differenceInCalendarDays(startOfDay(new Date(e.nextDueDate)), startOfDay(new Date()));
          const urgency = urgencyStyle(days);
          return (
            <Link
              key={e.id}
              href="/expenses"
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="h-8 w-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CreditCard size={11} />
                  {e.card} · {format(new Date(e.nextDueDate), "MMM d")}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(e.amount))}</p>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${urgency.pillClass}`}>
                  {urgency.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
