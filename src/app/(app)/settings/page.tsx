import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { TopBar } from "@/components/layout/TopBar";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const metadata = { title: "Settings — Remind Me" };

export default async function SettingsPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [settings, categories, user] = await Promise.all([
    prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: { userId },
    }),
    prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { reminders: true } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ]);

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 p-4 md:p-6 max-w-2xl space-y-6">
        <SettingsClient settings={settings} categories={categories} user={user!} />
      </main>
    </>
  );
}
