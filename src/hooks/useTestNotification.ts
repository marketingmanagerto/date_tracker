"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useTestNotification() {
  const [testing, setTesting] = useState(false);

  async function sendTest(title: string, notes?: string) {
    if (!title.trim()) {
      toast.error("Add a title first before testing");
      return;
    }

    setTesting(true);
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("Test failed — check your settings");
        return;
      }

      const { results } = data as { results: { email?: string; discord?: string } };
      const emailOk    = results.email === "sent";
      const discordOk  = results.discord === "sent";
      const emailSkip  = results.email?.startsWith("discord") || results.email === "no email address on account";
      const discordSkip = results.discord && results.discord !== "sent" && !results.discord.startsWith("failed");

      if (emailOk && discordOk) {
        toast.success("Test sent via email + Discord ✓");
      } else if (emailOk) {
        toast.success("Test email sent ✓", { description: discordSkip ? results.discord : results.discord });
      } else if (discordOk) {
        toast.success("Test Discord message sent ✓", { description: results.email });
      } else {
        // Surface whatever was returned
        const parts = [
          results.email && `Email: ${results.email}`,
          results.discord && `Discord: ${results.discord}`,
        ].filter(Boolean).join(" · ");
        toast.info(`Test result: ${parts}`);
      }
    } catch {
      toast.error("Network error — could not send test");
    } finally {
      setTesting(false);
    }
  }

  return { sendTest, testing };
}
