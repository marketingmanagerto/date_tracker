import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { title, notes } = parsed.data;

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true } }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const results: { email?: string; discord?: string } = {};

  // --- Email ---
  if (user.email) {
    try {
      const { Resend } = require("resend") as typeof import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "reminders@example.com",
        to: user.email,
        subject: `🧪 Test notification: ${title}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 36px;color:#fff;">
      <div style="font-size:13px;letter-spacing:.05em;opacity:.8;margin-bottom:6px;text-transform:uppercase;">Test notification</div>
      <div style="font-size:22px;font-weight:700;">🔔 ${title}</div>
    </div>
    <div style="padding:28px 36px;">
      <p style="color:#374151;margin:0 0 16px;font-size:15px;">
        Hi ${user.name || "there"} — this is a test notification from <strong>Remind Me</strong>.
        If you received this, your email notifications are working correctly.
      </p>
      ${notes ? `<div style="background:#f3f4f6;border-radius:8px;padding:14px 16px;margin-bottom:20px;color:#4b5563;font-size:14px;">${notes}</div>` : ""}
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/settings" style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;font-size:14px;">
          Manage notifications
        </a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 36px;text-align:center;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
      Remind Me · <a href="${appUrl}/settings" style="color:#6b7280;">Settings</a>
    </div>
  </div>
</body>
</html>`,
      });
      results.email = "sent";
    } catch (err) {
      results.email = `failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    results.email = "no email address on account";
  }

  // --- Discord ---
  if (settings?.discordNotifications && settings.discordWebhookUrl) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(settings.discordWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Remind Me",
          content: `🧪 **Test notification**`,
          embeds: [{
            title: `🔔 ${title}`,
            description: notes || undefined,
            color: 0x4f46e5,
            fields: [
              { name: "Status", value: "✅ Your Discord notifications are working!", inline: false },
            ],
            footer: { text: "Remind Me — test notification" },
            timestamp: new Date().toISOString(),
          }],
          components: [{
            type: 1,
            components: [
              { type: 2, style: 5, label: "📊 Dashboard", url: `${appUrl}/dashboard` },
              { type: 2, style: 5, label: "⚙️ Settings", url: `${appUrl}/settings` },
            ],
          }],
        }),
      });
      results.discord = res.ok ? "sent" : `failed: HTTP ${res.status}`;
    } catch (err) {
      results.discord = `failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  } else {
    results.discord = settings?.discordNotifications
      ? "no webhook URL configured"
      : "discord notifications disabled";
  }

  return NextResponse.json({ results });
}
