import Link from "next/link";
import { notFound } from "next/navigation";

import { updateTripAction } from "@/app/trip-actions";
import { TripForm } from "@/components/TripForm";
import { getTrip } from "@/lib/trip-repository";

export const dynamic = "force-dynamic";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();
  const action = updateTripAction.bind(null, trip.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/trips/${trip.id}`}
        className="text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline"
      >
        ← Back to Receipt
      </Link>
      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Edit Trip Receipt</h1>
          <p className="mt-2 text-sm text-slate-600">Update the details below and save your changes.</p>
        </div>
        <TripForm action={action} trip={trip} />
      </div>
    </div>
  );
}
