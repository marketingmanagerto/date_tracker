import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyActionToken } from "@/lib/action-tokens";
import { computeNextFireAt } from "@/lib/recurring-helpers";

function htmlPage(title: string, message: string, success: boolean) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const color = success ? "#059669" : "#DC2626";
  const icon = success ? "✅" : "❌";
  return new Response(
    `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Remind Me</title></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;">
  <div style="max-width:420px;text-align:center;padding:40px;">
    <div style="font-size:56px;margin-bottom:16px;">${icon}</div>
    <h1 style="margin:0 0 8px;color:#111827;font-size:22px;">${title}</h1>
    <p style="color:#6b7280;font-size:15px;margin:0 0 28px;">${message}</p>
    <a href="${appUrl}/dashboard" style="background:#4f46e5;color:#fff;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
      Open Dashboard
    </a>
  </div>
</body>
</html>`,
    { status: success ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id    = searchParams.get("id");
  const type  = searchParams.get("type") as "reminder" | "recurring" | null;
  const token = searchParams.get("token");

  if (!id || !type || !token || !["reminder", "recurring"].includes(type)) {
    return htmlPage("Invalid link", "This action link is malformed or expired.", false);
  }

  // Verify HMAC
  try {
    if (!verifyActionToken(id, `complete-${type}`, token)) {
      return htmlPage("Unauthorized", "This action link is invalid or has been tampered with.", false);
    }
  } catch {
    return htmlPage("Unauthorized", "This action link is invalid.", false);
  }

  if (type === "reminder") {
    const reminder = await prisma.reminder.findUnique({ where: { id } });
    if (!reminder) return htmlPage("Not found", "This reminder no longer exists.", false);
    if (reminder.status === "ARCHIVED") {
      return htmlPage("Already complete", `"${reminder.title}" was already marked complete.`, true);
    }

    await prisma.reminder.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    return htmlPage("Reminder complete!", `"${reminder.title}" has been archived. Nice work!`, true);
  }

  if (type === "recurring") {
    const task = await prisma.recurringTask.findUnique({ where: { id } });
    if (!task) return htmlPage("Not found", "This recurring task no longer exists.", false);

    const now = new Date();
    await prisma.recurringTask.update({
      where: { id },
      data: {
        lastFiredAt: now,
        nextFireAt: computeNextFireAt(now, task.interval, task.intervalValue),
      },
    });

    return htmlPage("Done!", `"${task.title}" marked complete. Next fire time has been advanced.`, true);
  }

  return htmlPage("Unknown type", "Something went wrong.", false);
}
