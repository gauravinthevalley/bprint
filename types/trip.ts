export const PAYMENT_METHODS = ["Cash", "Card", "Online", "Other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface Trip {
  id: string;
  tripId: string;
  date: string;
  time: string;
  driverName: string;
  taxiNumber: string;
  passengerName: string;
  pickupLocation: string;
  pickupTime: string;
  dropoffLocation: string;
  dropoffTime: string;
  paymentMethod: PaymentMethod;
  distanceKm: number;
  farePerKm: number | null;
  baseFare: number;
  distanceFare: number;
  timeCharge: number;
  permitCharge: number;
  netFare: number;
  createdAt: string;
  updatedAt: string;
}

export type TripInput = Omit<
  Trip,
  "id" | "farePerKm" | "distanceFare" | "netFare" | "createdAt" | "updatedAt"
> & {
  farePerKm: number;
};
export type CreateTripInput = TripInput;
export type UpdateTripInput = TripInput;
