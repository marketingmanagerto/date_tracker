import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRecurringTaskSchema } from "@/lib/validations";
import { computeNextFireAt } from "@/lib/recurring-helpers";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.recurringTask.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createRecurringTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { interval, intervalValue, ...rest } = parsed.data;

  // First fire = now — will trigger at the very next cron run
  const nextFireAt = new Date();

  const task = await prisma.recurringTask.create({
    data: {
      ...rest,
      interval,
      intervalValue,
      nextFireAt,
      userId: session.user.id,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
