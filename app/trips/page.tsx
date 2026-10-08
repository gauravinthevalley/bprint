import Link from "next/link";

import { AuthModal } from "@/components/AuthModal";
import { TripList } from "@/components/TripList";
import { getCurrentSession } from "@/lib/auth-session";
import { getTrips } from "@/lib/trip-repository";

export const dynamic = "force-dynamic";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getCurrentSession();
  const query = await searchParams;

  if (!session) {
    return (
      <div>
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Receipt records</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Saved Trips</h1>
        </div>
        <div className="h-64 rounded-lg border border-slate-200 bg-white" />
        <AuthModal next={query.next} />
      </div>
    );
  }

  const trips = await getTrips(session.user.id);

  return (
    <div>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Receipt records</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Saved Trips</h1>
          <p className="mt-2 text-slate-600">View, update, and print travel receipts.</p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex justify-center rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + New Trip
        </Link>
      </div>
      <TripList trips={trips} />
    </div>
  );
}
