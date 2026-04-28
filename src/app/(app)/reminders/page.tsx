import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { RemindersClient } from "@/components/reminders/RemindersClient";
import { ButtonLink } from "@/components/ui/button-link";
import { Plus } from "lucide-react";

export const metadata = { title: "Reminders — Remind Me" };

export default async function RemindersPage() {
  const session = await requireAuth();

  const [reminders, categories] = await Promise.all([
    prisma.reminder.findMany({
      where: { userId: session.user.id },
      include: { category: true },
      orderBy: { date: "asc" },
    }),
    prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <>
      <TopBar title="Reminders" />
      <main className="flex-1 p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{reminders.length} total reminder{reminders.length !== 1 ? "s" : ""}</p>
          <ButtonLink href="/reminders/new" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            Add reminder
          </ButtonLink>
        </div>
        <RemindersClient reminders={reminders} categories={categories} />
      </main>
    </>
  );
}
