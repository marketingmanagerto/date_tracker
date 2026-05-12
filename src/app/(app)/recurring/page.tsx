import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { RecurringClient } from "@/components/recurring/RecurringClient";

export const metadata = { title: "Recurring — Remind Me" };

export default async function RecurringPage() {
  const session = await requireAuth();

  const tasks = await prisma.recurringTask.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <TopBar title="Recurring" />
      <main className="flex-1 p-4 md:p-6 max-w-3xl space-y-2">
        <div className="mb-2">
          <p className="text-sm text-muted-foreground">
            Interval-based reminders that fire on a schedule — great for habits, medications, and check-ins.
          </p>
        </div>
        <RecurringClient tasks={tasks} />
      </main>
    </>
  );
}
