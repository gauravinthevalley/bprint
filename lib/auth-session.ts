import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser(destination?: string) {
  const session = await getCurrentSession();
  if (!session) {
    const next = destination?.startsWith("/trips") ? `?next=${encodeURIComponent(destination)}` : "";
    redirect(`/trips${next}`);
  }
  return session.user;
}
