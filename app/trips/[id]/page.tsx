import Link from "next/link";
import { notFound } from "next/navigation";

import { AutoPrint } from "@/components/AutoPrint";
import { PrintButton } from "@/components/PrintButton";
import { TripReceipt } from "@/components/TripReceipt";
import { getTrip } from "@/lib/trip-repository";

export const dynamic = "force-dynamic";

interface TripPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}

export default async function TripPage({ params, searchParams }: TripPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const trip = await getTrip(id);
  if (!trip) notFound();

  return (
    <div className="receipt-page">
      <AutoPrint enabled={query.print === "1"} />
      <div className="screen-only mx-auto mb-6 flex max-w-[210mm] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/trips" className="text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline">
          ← Back to Trips
        </Link>
        <div className="flex gap-3">
          <Link
            href={`/trips/${trip.id}/edit`}
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>
          <PrintButton />
        </div>
      </div>
      <div className="receipt-shell mx-auto max-w-[210mm] bg-white shadow-xl">
        <TripReceipt trip={trip} />
      </div>
    </div>
  );
}
