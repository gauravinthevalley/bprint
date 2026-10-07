"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatCurrency, formatDistance, formatListDate } from "@/lib/formatting";
import type { Trip } from "@/types/trip";

const columns = ["Date", "Passenger", "Pickup", "Drop Off", "Distance", "Net Fare", "Actions"];

export function TripList({ trips }: { trips: Trip[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const allSelected = trips.length > 0 && selectedIds.size === trips.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && !allSelected;
    }
  }, [allSelected, selectedIds.size]);

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

  function toggleTrip(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(trips.map((trip) => trip.id)));
  }

  function printSelected() {
    if (selectedIds.size === 0) return;
    const orderedIds = trips.filter((trip) => selectedIds.has(trip.id)).map((trip) => trip.id);
    router.push(`/trips/print?ids=${encodeURIComponent(orderedIds.join(","))}`);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700" aria-live="polite">
          {selectedIds.size} selected
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={printSelected}
            disabled={selectedIds.size === 0}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print Selected
          </button>
          <Link
            href="/trips/print?all=1"
            className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-700"
          >
            Print All
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="w-12 border-b border-slate-200 px-4 py-3">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all trips"
                  className="size-4 rounded border-slate-300 accent-slate-900"
                />
              </th>
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
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(trip.id)}
                    onChange={() => toggleTrip(trip.id)}
                    aria-label={`Select trip ${trip.tripId}`}
                    className="size-4 rounded border-slate-300 accent-slate-900"
                  />
                </td>
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
                      href={`/trips/print?ids=${trip.id}`}
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
