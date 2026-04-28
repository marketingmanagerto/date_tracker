import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReminderSchema } from "@/lib/validations";
import { getNextOccurrence } from "@/lib/rrule-helpers";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") || "ACTIVE";
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "date";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {
    userId: session.user.id,
    ...(status !== "ALL" && { status }),
    ...(categoryId && { categoryId }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
  };

  const [reminders, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      include: { category: true },
      orderBy: sortBy === "priority"
        ? [{ priority: "desc" }, { date: "asc" }]
        : sortBy === "createdAt"
        ? { createdAt: "desc" }
        : { date: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.reminder.count({ where }),
  ]);

  const withNextOccurrence = reminders.map((r) => ({
    ...r,
    nextOccurrence: getNextOccurrence(r),
  }));

  return NextResponse.json({ reminders: withNextOccurrence, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createReminderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reminder = await prisma.reminder.create({
    data: { ...parsed.data, userId: session.user.id },
    include: { category: true },
  });

  return NextResponse.json(reminder, { status: 201 });
}
