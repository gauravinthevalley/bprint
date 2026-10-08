"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  deleteAllTripsAction,
  deleteSelectedTripsAction,
  deleteTripAction,
} from "@/app/trip-actions";
import { formatCurrency, formatDistance, formatListDate } from "@/lib/formatting";
import type { Trip } from "@/types/trip";

const columns = ["Date", "Passenger", "Pickup", "Drop Off", "Distance", "Net Fare", "Actions"];

export function TripList({ trips }: { trips: Trip[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<"selected" | "all" | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
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

  function confirmDelete(id: string) {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteTripAction(id);
      if (!result.success) {
        setDeleteError(result.error ?? "The trip could not be deleted.");
        return;
      }

      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setConfirmingDeleteId(null);
      router.refresh();
    });
  }

  function confirmBulkDelete() {
    if (!bulkDeleteMode) return;
    const mode = bulkDeleteMode;
    const ids = Array.from(selectedIds);
    setDeleteError(null);

    startDeleteTransition(async () => {
      const result =
        mode === "all" ? await deleteAllTripsAction() : await deleteSelectedTripsAction(ids);
      if (!result.success) {
        setDeleteError(result.error ?? "The trips could not be deleted.");
        return;
      }

      setSelectedIds(new Set());
      setBulkDeleteMode(null);
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700" aria-live="polite">
          {selectedIds.size} selected
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
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
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDeleteId(null);
              setBulkDeleteMode("selected");
            }}
            disabled={selectedIds.size === 0}
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete Selected
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setConfirmingDeleteId(null);
              setBulkDeleteMode("all");
            }}
            className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Delete All
          </button>
        </div>
      </div>
      {bulkDeleteMode && (
        <div className="flex flex-col gap-3 border-b border-red-200 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-900">
            {bulkDeleteMode === "all"
              ? `Delete all ${trips.length} trips? This cannot be undone.`
              : `Delete ${selectedIds.size} selected ${selectedIds.size === 1 ? "trip" : "trips"}? This cannot be undone.`}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBulkDeleteMode(null)}
              disabled={deletePending}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmBulkDelete}
              disabled={deletePending}
              className="rounded-md bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {deletePending ? "Deleting…" : "Confirm Delete"}
            </button>
          </div>
        </div>
      )}
      {deleteError && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {deleteError}
        </div>
      )}
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
                  {confirmingDeleteId === trip.id ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Delete?</span>
                      <button
                        type="button"
                        onClick={() => setConfirmingDeleteId(null)}
                        disabled={deletePending}
                        className="font-semibold text-slate-600 hover:underline disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDelete(trip.id)}
                        disabled={deletePending}
                        className="font-semibold text-red-700 hover:underline disabled:opacity-50"
                      >
                        {deletePending ? "Deleting…" : "Confirm"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Link
                        className="font-semibold text-slate-800 hover:underline"
                        href={`/trips/${trip.id}`}
                      >
                        View
                      </Link>
                      <Link
                        className="font-semibold text-slate-600 hover:underline"
                        href={`/trips/${trip.id}/edit`}
                      >
                        Edit
                      </Link>
                      <Link
                        className="font-semibold text-slate-600 hover:underline"
                        href={`/trips/print?ids=${trip.id}`}
                      >
                        Print
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setBulkDeleteMode(null);
                          setConfirmingDeleteId(trip.id);
                        }}
                        className="font-semibold text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
