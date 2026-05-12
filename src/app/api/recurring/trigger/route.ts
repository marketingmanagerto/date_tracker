import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeNextFireAt, intervalLabel } from "@/lib/recurring-helpers";
import { completeUrl } from "@/lib/action-tokens";

/**
 * POST /api/recurring/trigger
 * Manually fires all pending recurring tasks for the current user.
 * No CRON_SECRET needed — uses session auth instead.
 */
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();

  const dueTasks = await prisma.recurringTask.findMany({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
      nextFireAt: { lte: now },
    },
  });

  if (dueTasks.length === 0) {
    return NextResponse.json({ fired: 0, message: "No pending tasks" });
  }

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
  ]);

  let fired = 0;
  const errors: string[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const task of dueTasks) {
    try {
      // Send email
      if (task.notifyEmail && user?.email) {
        try {
          const { Resend } = require("resend") as typeof import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "reminders@example.com",
            to: user.email,
            subject: `🔔 Reminder: ${task.title}`,
            html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:500px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 36px;color:#fff;">
      <div style="font-size:24px;">🔔 ${task.title}</div>
    </div>
    <div style="padding:28px 36px;">
      ${task.notes ? `<p style="color:#6b7280;font-size:14px;margin:0 0 20px;">${task.notes}</p>` : ""}
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/recurring" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">Manage</a>
      </div>
    </div>
  </div>
</body></html>`,
          });
        } catch (err) {
          errors.push(`email:${task.id}: ${err}`);
        }
      }

      // Send Discord
      if (task.notifyDiscord && settings?.discordNotifications && settings.discordWebhookUrl) {
        try {
          await fetch(settings.discordWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "Remind Me",
              content: `🔔 **Recurring Reminder:** ${task.title}`,
              embeds: [{
                title: `🔁 ${task.title}`,
                description: task.notes ? `> ${task.notes}` : undefined,
                color: 0x4f46e5,
                fields: [
                  { name: "Interval", value: intervalLabel(task.interval, task.intervalValue), inline: true },
                ],
                footer: { text: "Remind Me — Recurring reminder" },
                timestamp: now.toISOString(),
              }],
              components: [{
                type: 1,
                components: [
                  { type: 2, style: 5, label: "✅ Mark Complete", url: completeUrl(task.id, "recurring") },
                  { type: 2, style: 5, label: "Manage", url: `${appUrl}/recurring` },
                ],
              }],
            }),
          });
        } catch (err) {
          errors.push(`discord:${task.id}: ${err}`);
        }
      }

      // Advance
      await prisma.recurringTask.update({
        where: { id: task.id },
        data: {
          lastFiredAt: now,
          nextFireAt: computeNextFireAt(now, task.interval, task.intervalValue),
        },
      });

      fired++;
    } catch (err) {
      errors.push(`task:${task.id}: ${err}`);
    }
  }

  return NextResponse.json({ fired, total: dueTasks.length, errors });
}
