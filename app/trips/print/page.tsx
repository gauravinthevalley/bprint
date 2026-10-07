import Link from "next/link";

import { CompactTripReceipt } from "@/components/CompactTripReceipt";
import { PrintButton } from "@/components/PrintButton";
import { createPrintSheets, selectTripsForPrint } from "@/lib/printing";
import { getTrips } from "@/lib/trip-repository";

export const dynamic = "force-dynamic";

interface PrintTripsPageProps {
  searchParams: Promise<{ all?: string; ids?: string }>;
}

export default async function PrintTripsPage({ searchParams }: PrintTripsPageProps) {
  const query = await searchParams;
  const trips = await getTrips();
  const selectedTrips = selectTripsForPrint(trips, {
    printAll: query.all === "1",
    ids: query.ids?.split(",") ?? [],
  });
  const sheets = createPrintSheets(selectedTrips);

  return (
    <div className="print-preview">
      <div className="screen-only mx-auto mb-6 flex max-w-[210mm] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/trips" className="text-sm font-semibold text-slate-600 hover:text-slate-950 hover:underline">
            ← Back to Trips
          </Link>
          <p className="mt-2 text-sm text-slate-600">
            {selectedTrips.length} {selectedTrips.length === 1 ? "receipt" : "receipts"} · {sheets.length}{" "}
            {sheets.length === 1 ? "A4 sheet" : "A4 sheets"}
          </p>
        </div>
        {selectedTrips.length > 0 && <PrintButton label="Print Receipts" />}
      </div>

      {sheets.length === 0 ? (
        <div className="screen-only mx-auto max-w-xl rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-950">No trips selected</h1>
          <p className="mt-2 text-sm text-slate-600">Return to the trips list and choose at least one receipt.</p>
        </div>
      ) : (
        <div className="print-preview-scroll">
          <div className="print-sheets">
            {sheets.map((sheet, sheetIndex) => (
              <section
                key={sheetIndex}
                className="receipt-sheet"
                aria-label={`Receipt sheet ${sheetIndex + 1} of ${sheets.length}`}
              >
                {sheet.map((trip, slotIndex) =>
                  trip ? (
                    <CompactTripReceipt key={trip.id} trip={trip} />
                  ) : (
                    <div key={`blank-${slotIndex}`} className="receipt-blank-slot" aria-hidden="true" />
                  ),
                )}
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
