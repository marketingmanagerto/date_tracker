import type { ReminderWithCategory } from "@/types";
import { daysUntilNext } from "./rrule-helpers";
import { formatDateShort } from "./utils";

function getResend() {
  const { Resend } = require("resend") as typeof import("resend");
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendDigestEmail(
  to: string,
  userName: string,
  dueReminders: ReminderWithCategory[],
  overdueReminders: ReminderWithCategory[]
) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const urgencyColor = (days: number | null) => {
    if (days === null || days < 0) return "#DC2626";
    if (days === 0) return "#DC2626";
    if (days <= 3) return "#F97316";
    if (days <= 7) return "#F59E0B";
    return "#3B82F6";
  };

  const reminderRow = (r: ReminderWithCategory) => {
    const days = daysUntilNext(r);
    const label = days === null ? "?" : days === 0 ? "Today!" : days < 0 ? "Overdue" : `In ${days} day${days === 1 ? "" : "s"}`;
    const color = urgencyColor(days);
    return `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;">
          <span style="font-size:20px;margin-right:8px;">${r.category.icon}</span>
          <strong>${r.title}</strong>
          <div style="color:#6b7280;font-size:13px;margin-top:2px;">${r.category.name} · ${formatDateShort(r.date)}</div>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;">
          <span style="background:${color}1a;color:${color};padding:3px 10px;border-radius:999px;font-size:13px;font-weight:600;">${label}</span>
        </td>
      </tr>`;
  };

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;color:#fff;">
      <div style="font-size:28px;margin-bottom:4px;">🔔 Reminder Digest</div>
      <div style="opacity:0.85;font-size:14px;">${today}</div>
    </div>
    <div style="padding:32px 40px;">
      <p style="color:#374151;margin:0 0 24px;">Hi ${userName || "there"}, here's what's coming up:</p>

      ${overdueReminders.length > 0 ? `
      <h3 style="color:#DC2626;margin:0 0 12px;font-size:16px;">⚠️ Needs Attention (${overdueReminders.length})</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #fca5a5;border-radius:8px;overflow:hidden;">
        ${overdueReminders.map(reminderRow).join("")}
      </table>` : ""}

      ${dueReminders.length > 0 ? `
      <h3 style="color:#374151;margin:0 0 12px;font-size:16px;">📅 Upcoming (${dueReminders.length})</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        ${dueReminders.map(reminderRow).join("")}
      </table>` : ""}

      <div style="text-align:center;margin-top:32px;">
        <a href="${appUrl}/dashboard" style="background:#4f46e5;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">View Dashboard</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:20px 40px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
      <a href="${appUrl}/settings" style="color:#6b7280;">Manage notification preferences</a>
    </div>
  </div>
</body>
</html>`;

  const subject = overdueReminders.length > 0
    ? `⚠️ ${overdueReminders.length} overdue + ${dueReminders.length} upcoming reminders`
    : `📅 You have ${dueReminders.length} upcoming reminder${dueReminders.length === 1 ? "" : "s"}`;

  const resend = getResend();
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "reminders@example.com",
    to,
    subject,
    html,
  });
}

export async function sendDiscordNotification(
  webhookUrl: string,
  dueReminders: ReminderWithCategory[],
  overdueReminders: ReminderWithCategory[]
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const urgencyEmoji = (days: number | null) => {
    if (days === null || days < 0) return "🔴";
    if (days === 0) return "🔴";
    if (days <= 3) return "🟠";
    if (days <= 7) return "🟡";
    return "🟢";
  };

  const embeds = [];

  if (overdueReminders.length > 0) {
    embeds.push({
      title: `⚠️ Needs Attention (${overdueReminders.length})`,
      color: 0xdc2626, // red
      fields: overdueReminders.map((r) => {
        const days = daysUntilNext(r);
        const ago = days !== null ? `${Math.abs(days)}d ago` : "overdue";
        return {
          name: `${r.category.icon} ${r.title}`,
          value: `${r.category.name} · ${formatDateShort(r.date)} · **${ago}**`,
          inline: false,
        };
      }),
    });
  }

  if (dueReminders.length > 0) {
    embeds.push({
      title: `📅 Upcoming (${dueReminders.length})`,
      color: 0x4f46e5, // indigo
      fields: dueReminders.map((r) => {
        const days = daysUntilNext(r);
        const label = days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`;
        return {
          name: `${urgencyEmoji(days)} ${r.category.icon} ${r.title}`,
          value: `${r.category.name} · ${formatDateShort(r.date)} · **${label}**`,
          inline: false,
        };
      }),
    });
  }

  const payload = {
    username: "Remind Me",
    avatar_url: `${appUrl}/icon.png`,
    content: overdueReminders.length > 0
      ? `🔔 You have **${overdueReminders.length}** overdue and **${dueReminders.length}** upcoming reminders.`
      : `🔔 You have **${dueReminders.length}** upcoming reminder${dueReminders.length === 1 ? "" : "s"}.`,
    embeds,
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "View Dashboard",
            url: `${appUrl}/dashboard`,
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${text}`);
  }
}
