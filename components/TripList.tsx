import Link from "next/link";

import { formatCurrency, formatDistance, formatListDate } from "@/lib/formatting";
import type { Trip } from "@/types/trip";

const columns = ["Date", "Passenger", "Pickup", "Drop Off", "Distance", "Net Fare", "Actions"];

export function TripList({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <h2 className="text-lg font-semibold text-slate-900">No trips saved yet</h2>
        <p className="mt-2 text-sm text-slate-600">Create your first trip receipt to get started.</p>
        <Link
          href="/trips/new"
          className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
        >
          + New Trip
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-slate-200 px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trips.map((trip) => (
              <tr key={trip.id} className="align-top hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">{formatListDate(trip.date)}</td>
                <td className="px-4 py-4 font-medium text-slate-900">{trip.passengerName || "—"}</td>
                <td className="max-w-48 px-4 py-4 text-slate-700">{trip.pickupLocation}</td>
                <td className="max-w-48 px-4 py-4 text-slate-700">{trip.dropoffLocation}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-700">
                  {formatDistance(trip.distanceKm)} km
                </td>
                <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                  {formatCurrency(trip.netFare)}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-3">
                    <Link className="font-semibold text-slate-800 hover:underline" href={`/trips/${trip.id}`}>
                      View
                    </Link>
                    <Link
                      className="font-semibold text-slate-600 hover:underline"
                      href={`/trips/${trip.id}?print=1`}
                    >
                      Print
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
