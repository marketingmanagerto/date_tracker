import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ db: "ok" });
  } catch (err) {
    return NextResponse.json(
      { db: "error", detail: String(err) },
      { status: 500 }
    );
  }
}
