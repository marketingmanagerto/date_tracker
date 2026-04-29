import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

type Params = { params: Promise<{ id: string }> };

/** Advance a due date by one frequency period */
function advanceDueDate(current: Date, frequency: string): Date {
  switch (frequency) {
    case "DAILY":     return addDays(current, 1);
    case "WEEKLY":    return addWeeks(current, 1);
    case "MONTHLY":   return addMonths(current, 1);
    case "QUARTERLY": return addMonths(current, 3);
    case "YEARLY":    return addYears(current, 1);
    default:          return current; // ONE_TIME — no advance
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Special action: mark as paid → advance next due date
  if (body.markPaid === true) {
    const next = advanceDueDate(existing.nextDueDate, existing.frequency);
    const updated = await prisma.expense.update({
      where: { id },
      data: { nextDueDate: next },
    });
    return NextResponse.json(updated);
  }

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: Prisma.ExpenseUncheckedUpdateInput = { ...parsed.data };
  if (parsed.data.amount !== undefined) {
    data.amount = new Prisma.Decimal(parsed.data.amount);
  }

  const expense = await prisma.expense.update({ where: { id }, data });
  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.expense.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
