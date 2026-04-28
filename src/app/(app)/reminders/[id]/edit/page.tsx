import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ReminderForm } from "@/components/reminders/ReminderForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit Reminder — Remind Me" };

export default async function EditReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const [reminder, categories] = await Promise.all([
    prisma.reminder.findFirst({
      where: { id, userId: session.user.id },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!reminder) notFound();

  return (
    <>
      <TopBar title="Edit Reminder" />
      <main className="flex-1 p-4 md:p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit: {reminder.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ReminderForm categories={categories} reminder={reminder} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
