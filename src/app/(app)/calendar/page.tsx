import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { CalendarView } from "@/components/calendar/CalendarView";

export const metadata = { title: "Calendar — Remind Me" };

export default async function CalendarPage() {
  const session = await requireAuth();

  const reminders = await prisma.reminder.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    include: { category: true },
  });

  return (
    <>
      <TopBar title="Calendar" />
      <main className="flex-1 p-4 md:p-6">
        <CalendarView reminders={reminders} />
      </main>
    </>
  );
}
