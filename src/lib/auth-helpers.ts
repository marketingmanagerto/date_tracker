import { auth } from "./auth";
import { redirect } from "next/navigation";

export interface AuthSession {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session as AuthSession;
}

export async function getSession() {
  return auth();
}
