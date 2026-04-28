import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCategorySchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { reminders: true } } },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slug = `custom-${parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

  const category = await prisma.category.create({
    data: { ...parsed.data, slug, userId: session.user.id, isSystem: false },
  });

  return NextResponse.json(category, { status: 201 });
}
