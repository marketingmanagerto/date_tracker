import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextOccurrence, daysUntilNext } from "@/lib/rrule-helpers";
import { sendDigestEmail, sendDiscordNotification } from "@/lib/notifications";
import { startOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
  return POST(req);
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    cronSecret !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allSettings = await prisma.userSettings.findMany({
    where: {
      OR: [
        { emailNotifications: true },
        { discordNotifications: true },
      ],
    },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  let emailsSent = 0;
  let discordSent = 0;
  const errors: string[] = [];

  for (const settings of allSettings) {
    const { user } = settings;

    try {
      const reminders = await prisma.reminder.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        include: { category: true },
      });

      const today = startOfDay(new Date());
      const due = [];
      const overdue = [];

      for (const r of reminders) {
        const days = daysUntilNext(r);
        if (days === null) continue;

        if (days < 0) {
          overdue.push(r);
          continue;
        }

        if (days > r.advanceDays) continue;

        const next = getNextOccurrence(r, today);
        if (!next) continue;

        // De-duplicate: skip if already notified within this advance window
        const windowStart = subDays(next, r.advanceDays);
        const alreadySent = await prisma.notificationLog.findFirst({
          where: {
            reminderId: r.id,
            type: "email",
            sentAt: { gte: windowStart },
            success: true,
          },
        });
        if (alreadySent) continue;

        due.push(r);
      }

      if (due.length === 0 && overdue.length === 0) continue;

      // Send email
      if (settings.emailNotifications && user.email) {
        try {
          const result = await sendDigestEmail(user.email, user.name || "there", due, overdue);
          const allIncluded = [...due, ...overdue];
          await prisma.notificationLog.createMany({
            data: allIncluded.map((r) => ({
              userId: user.id,
              reminderId: r.id,
              type: "email",
              subject: `Digest for ${user.email}`,
              success: !("error" in result),
            })),
          });
          emailsSent++;
        } catch (err) {
          errors.push(`email:${user.email}: ${err}`);
        }
      }

      // Send Discord
      if (settings.discordNotifications && settings.discordWebhookUrl) {
        try {
          await sendDiscordNotification(settings.discordWebhookUrl, due, overdue);
          const allIncluded = [...due, ...overdue];
          await prisma.notificationLog.createMany({
            data: allIncluded.map((r) => ({
              userId: user.id,
              reminderId: r.id,
              type: "discord",
              success: true,
            })),
          });
          discordSent++;
        } catch (err) {
          errors.push(`discord:${user.id}: ${err}`);
        }
      }
    } catch (err) {
      errors.push(`${user.id}: ${err}`);
    }
  }

  return NextResponse.json({ emailsSent, discordSent, errors });
}
