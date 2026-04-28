import { prisma } from "./prisma";

const SYSTEM_CATEGORIES = [
  { name: "Birthday", slug: "birthday", icon: "🎂", color: "#FF6B6B" },
  { name: "Anniversary", slug: "anniversary", icon: "💍", color: "#FF85A1" },
  { name: "Holiday", slug: "holiday", icon: "🎉", color: "#FFD166" },
  { name: "Medical / Health", slug: "medical", icon: "🏥", color: "#06D6A0" },
  { name: "Legal / Document", slug: "legal", icon: "📋", color: "#118AB2" },
  { name: "Financial / Subscription", slug: "financial", icon: "💳", color: "#2D6A9F" },
  { name: "Vehicle", slug: "vehicle", icon: "🚗", color: "#4ECDC4" },
  { name: "Property / Home", slug: "property", icon: "🏠", color: "#45B7D1" },
  { name: "Pet", slug: "pet", icon: "🐾", color: "#96CEB4" },
  { name: "Travel", slug: "travel", icon: "✈️", color: "#88D8B0" },
  { name: "Professional / Work", slug: "work", icon: "💼", color: "#6C63FF" },
  { name: "Education", slug: "education", icon: "🎓", color: "#A8DADC" },
  { name: "Memorial", slug: "memorial", icon: "🕯️", color: "#8B8B8B" },
  { name: "Custom", slug: "custom", icon: "⭐", color: "#FFA07A" },
] as const;

export async function ensureSystemCategories(userId: string): Promise<void> {
  const existing = await prisma.category.findMany({
    where: { userId, isSystem: true },
    select: { slug: true },
  });

  const existingSlugs = new Set(existing.map((c) => c.slug));
  const missing = SYSTEM_CATEGORIES.filter((c) => !existingSlugs.has(c.slug));

  if (missing.length === 0) return;

  await prisma.category.createMany({
    data: missing.map((c) => ({ ...c, userId, isSystem: true })),
  });
}

export { SYSTEM_CATEGORIES };
