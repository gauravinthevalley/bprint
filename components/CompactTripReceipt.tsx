import {
  calculateReceiptNetFare,
  formatCurrency,
  formatDistance,
  formatReceiptDate,
  formatReceiptTime,
} from "@/lib/formatting";
import type { Trip } from "@/types/trip";

function CompactDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-detail">
      <dt>{label}:</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function CompactFare({ label, value }: { label: string; value: number }) {
  return (
    <div className="compact-fare-row">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}

export function CompactTripReceipt({ trip }: { trip: Trip }) {
  return (
    <article className="six-up-receipt" aria-label={`Receipt for trip ${trip.tripId}`}>
      <header className="compact-receipt-heading">
        <h2>Passenger Receipt</h2>
        <p>Trip ID: #{trip.tripId}</p>
      </header>

      <div className="compact-receipt-body">
        <p className="compact-date">{formatReceiptDate(trip.date)}</p>
        <dl className="compact-two-column">
          <CompactDetail label="Driver" value={trip.driverName} />
          <CompactDetail label="Taxi No." value={trip.taxiNumber} />
        </dl>
        <dl className="compact-details">
          <CompactDetail label="Passenger" value={trip.passengerName} />
          <CompactDetail
            label="Pickup"
            value={`${trip.pickupLocation}${trip.pickupTime ? ` — ${formatReceiptTime(trip.pickupTime)}` : ""}`}
          />
          <CompactDetail
            label="Drop Off"
            value={`${trip.dropoffLocation}${trip.dropoffTime ? ` — ${formatReceiptTime(trip.dropoffTime)}` : ""}`}
          />
        </dl>
        <div className="compact-meta">
          <span>Paid via – {trip.paymentMethod}</span>
          <span>Distance: {formatDistance(trip.distanceKm)} km</span>
        </div>
      </div>

      <div className="compact-fares">
        <CompactFare label="Base Fare" value={trip.baseFare} />
        <CompactFare label="Distance Fare" value={trip.distanceFare} />
        <CompactFare label="Time Charge" value={trip.timeCharge} />
        <CompactFare label="Permit Charge" value={trip.permitCharge} />
        <div className="compact-fare-row compact-net-fare">
          <span>Net Fare</span>
          <span>{formatCurrency(calculateReceiptNetFare(trip))}</span>
        </div>
      </div>
    </article>
  );
}
