import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New Reminder — Remind Me" };

export default async function NewReminderPage() {
  const session = await requireAuth();

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <TopBar title="New Reminder" />
      <main className="flex-1 p-4 md:p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add a reminder</CardTitle>
          </CardHeader>
          <CardContent>
            <ReminderForm categories={categories} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
