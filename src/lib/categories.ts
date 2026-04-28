import { prisma } from "./prisma";

export const SYSTEM_CATEGORIES = [
  { name: "Birthday",    slug: "birthday",    icon: "cake",  color: "#FF6B6B" },
  { name: "Anniversary", slug: "anniversary", icon: "heart", color: "#FF85A1" },
] as const;

// Lucide icon names available for custom categories
export const CATEGORY_ICONS = [
  "cake", "heart", "star", "bell", "briefcase",
  "car", "home", "plane", "stethoscope", "graduation-cap",
  "dog", "credit-card", "scale", "flame", "gift", "music",
] as const;

export type CategoryIconName = typeof CATEGORY_ICONS[number];

export async function ensureSystemCategories(userId: string): Promise<void> {
  const existing = await prisma.category.findMany({
    where: { userId, isSystem: true },
    select: { slug: true },
  });

  const existingSlugs = new Set(existing.map((c) => c.slug));
  const missing = SYSTEM_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));

  if (missing.length > 0) {
    await prisma.category.createMany({
      data: missing.map((c) => ({ ...c, userId, isSystem: true })),
    });
  }

  // Keep existing system categories in sync with canonical icon/name/color
  for (const cat of SYSTEM_CATEGORIES) {
    if (existingSlugs.has(cat.slug)) {
      await prisma.category.updateMany({
        where: { userId, isSystem: true, slug: cat.slug },
        data: { icon: cat.icon, name: cat.name, color: cat.color },
      });
    }
  }
}

// Remove system categories no longer in SYSTEM_CATEGORIES (only if they have no reminders)
export async function pruneSystemCategories(userId: string): Promise<void> {
  const validSlugs = SYSTEM_CATEGORIES.map((c) => c.slug);

  const stale = await prisma.category.findMany({
    where: {
      userId,
      isSystem: true,
      slug: { notIn: validSlugs },
    },
    include: { _count: { select: { reminders: true } } },
  });

  const deletable = stale.filter((c) => c._count.reminders === 0).map((c) => c.id);
  if (deletable.length === 0) return;

  await prisma.category.deleteMany({ where: { id: { in: deletable } } });
}
