import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cat = await prisma.category.findFirst({ where: { id, userId: session.user.id } });
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cat.isSystem) return NextResponse.json({ error: "Cannot modify system categories" }, { status: 403 });

  const body = await req.json();
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.category.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cat = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
    include: { _count: { select: { reminders: true } } },
  });
  if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cat.isSystem) return NextResponse.json({ error: "Cannot delete system categories" }, { status: 403 });
  if (cat._count.reminders > 0) return NextResponse.json({ error: "Category has active reminders" }, { status: 409 });

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
