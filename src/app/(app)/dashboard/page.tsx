import { requireAuth } from "@/lib/auth-helpers";
import { TopBar } from "@/components/layout/TopBar";
import { getTodayReminders, getUpcomingReminders, getOverdueReminders, groupUpcoming } from "@/lib/reminders";
import { prisma } from "@/lib/prisma";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { ButtonLink } from "@/components/ui/button-link";
import { Plus } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";

export const metadata = { title: "Dashboard — Remind Me" };

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [today, upcoming, overdue, totalActive, monthCount] = await Promise.all([
    getTodayReminders(userId),
    getUpcomingReminders(userId, 30),
    getOverdueReminders(userId),
    prisma.reminder.count({ where: { userId, status: "ACTIVE" } }),
    prisma.reminder.count({
      where: {
        userId,
        status: "ACTIVE",
        date: { gte: startOfMonth(new Date()), lte: endOfMonth(new Date()) },
      },
    }),
  ]);

  const groups = groupUpcoming(upcoming.filter((r) => {
    const d = today.find((t) => t.id === r.id);
    return !d;
  }));

  const dueThisWeek = upcoming.filter((r) => {
    const days = upcoming.indexOf(r);
    return days < 7;
  }).length;

  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
            <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s on your radar</p>
          </div>
          <ButtonLink href="/reminders/new" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add reminder
          </ButtonLink>
        </div>

        <StatsRow
          totalActive={totalActive}
          dueThisWeek={dueThisWeek}
          overdueCount={overdue.length}
          monthCount={monthCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayCard reminders={today} />
            <UpcomingList groups={groups} />
          </div>
          {overdue.length > 0 && (
            <div>
              <OverdueList reminders={overdue} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
