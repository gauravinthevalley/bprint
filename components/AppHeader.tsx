import Link from "next/link";

import { SignOutButton } from "@/components/SignOutButton";
import { getCurrentSession } from "@/lib/auth-session";

export async function AppHeader() {
  const session = await getCurrentSession();

  return (
    <header className="app-header border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/trips" className="text-lg font-semibold tracking-tight text-slate-950">
          Travel Receipts
        </Link>
        {session && (
          <div className="flex items-center gap-4">
            <span className="hidden max-w-56 truncate text-sm text-slate-500 sm:block">
              {session.user.email}
            </span>
            <SignOutButton />
            <Link
              href="/trips/new"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              + New Trip
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
