import crypto from "crypto";

const secret = () => process.env.NEXTAUTH_SECRET || process.env.CRON_SECRET || "fallback-secret";

/** Generate a short HMAC token for a given action */
export function generateActionToken(id: string, action: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`${action}:${id}`)
    .digest("hex")
    .slice(0, 24);
}

/** Verify a token matches the expected action + id */
export function verifyActionToken(id: string, action: string, token: string): boolean {
  const expected = generateActionToken(id, action);
  return crypto.timingSafeEqual(
    Buffer.from(expected, "utf8"),
    Buffer.from(token, "utf8")
  );
}

/** Build the full "mark complete" URL for a reminder or recurring task */
export function completeUrl(
  id: string,
  type: "reminder" | "recurring",
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const token = generateActionToken(id, `complete-${type}`);
  return `${appUrl}/api/actions/complete?id=${id}&type=${type}&token=${token}`;
}
