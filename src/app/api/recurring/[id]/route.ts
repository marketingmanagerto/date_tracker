import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRecurringTaskSchema } from "@/lib/validations";
import { computeNextFireAt } from "@/lib/recurring-helpers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recurringTask.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateRecurringTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { interval, intervalValue, ...rest } = parsed.data;

  // Recompute nextFireAt if interval settings changed
  const newInterval      = interval ?? existing.interval;
  const newIntervalValue = intervalValue ?? existing.intervalValue;
  const intervalChanged  = interval !== undefined || intervalValue !== undefined;

  const task = await prisma.recurringTask.update({
    where: { id },
    data: {
      ...rest,
      interval:      newInterval,
      intervalValue: newIntervalValue,
      // Reset nextFireAt from now so the new schedule takes effect immediately
      ...(intervalChanged ? { nextFireAt: computeNextFireAt(new Date(), newInterval, newIntervalValue) } : {}),
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.recurringTask.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.recurringTask.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
