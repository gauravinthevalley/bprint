import {
  calculateReceiptNetFare,
  formatCurrency,
  formatDistance,
  formatReceiptDate,
} from "@/lib/formatting";
import type { Trip } from "@/types/trip";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="receipt-detail-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function FareRow({ label, value, total = false }: { label: string; value: number; total?: boolean }) {
  return (
    <div className={`receipt-fare-row${total ? " receipt-total" : ""}`}>
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function TripReceipt({ trip }: { trip: Trip }) {
  return (
    <article className="trip-receipt" aria-label={`Receipt for trip ${trip.tripId}`}>
      <header className="receipt-heading">
        <h1>Trip Details</h1>
        <p>
          Trip ID: <strong>#{trip.tripId}</strong>
        </p>
      </header>

      <section className="receipt-section">
        <h2>Trip Info</h2>
        <p className="receipt-date">{formatReceiptDate(trip.date)}</p>

        <dl className="receipt-grid">
          <DetailRow label="Driver" value={trip.driverName} />
          <DetailRow label="Taxi Number" value={trip.taxiNumber} />
        </dl>
        <dl className="receipt-details">
          <DetailRow label="Passenger" value={trip.passengerName} />
          <DetailRow
            label="Pickup"
            value={`${trip.pickupLocation}${trip.pickupTime ? ` — ${trip.pickupTime}` : ""}`}
          />
          <DetailRow
            label="Drop Off"
            value={`${trip.dropoffLocation}${trip.dropoffTime ? ` — ${trip.dropoffTime}` : ""}`}
          />
        </dl>
        <p className="receipt-payment">Paid via – {trip.paymentMethod} Payment</p>
      </section>

      <section className="receipt-section receipt-fares">
        <p className="receipt-distance">Distance: {formatDistance(trip.distanceKm)} km</p>
        <FareRow label="Base Fare" value={trip.baseFare} />
        <FareRow label="Distance" value={trip.distanceFare} />
        <FareRow label="Time Charge" value={trip.timeCharge} />
        <FareRow label="Permit Charge" value={trip.permitCharge} />
        <FareRow label="Net Fare" value={calculateReceiptNetFare(trip)} total />
      </section>
    </article>
  );
}
