import Link from "next/link";

import { createTripAction } from "@/app/trip-actions";
import { TripForm } from "@/components/TripForm";

export const dynamic = "force-dynamic";

function localDateToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function NewTripPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/trips" className="text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline">
        ← Back to Trips
      </Link>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Create Trip Receipt</h1>
          <p className="mt-2 text-sm text-slate-600">Fields marked with * are required.</p>
        </div>
        <TripForm action={createTripAction} defaultDate={localDateToday()} />
      </div>
    </div>
  );
}
