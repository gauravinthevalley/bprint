import Link from "next/link";

import { createTripAction } from "@/app/trip-actions";
import { TripForm } from "@/components/TripForm";
import { requireUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

function localDateToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function NewTripPage() {
  await requireUser("/trips/new");

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/trips" className="text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline">
        ← Back to Trips
      </Link>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Create Trip Receipt</h1>
          <p className="text-xs text-slate-500">Fields marked with * are required.</p>
        </div>
        <TripForm action={createTripAction} defaultDate={localDateToday()} />
      </div>
    </div>
  );
}
