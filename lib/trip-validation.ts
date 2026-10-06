import { calculateNetFare } from "@/lib/formatting";
import { PAYMENT_METHODS, type TripInput } from "@/types/trip";

export type TripField = keyof TripInput;

export interface TripValidationResult {
  data?: TripInput;
  fieldErrors: Partial<Record<TripField, string>>;
}

const requiredFields: Array<[TripField, string]> = [
  ["date", "Date is required."],
  ["driverName", "Driver name is required."],
  ["taxiNumber", "Taxi or vehicle number is required."],
  ["pickupLocation", "Pickup location is required."],
  ["dropoffLocation", "Drop off location is required."],
];

const numberFields: Array<[TripField, boolean]> = [
  ["distanceKm", true],
  ["baseFare", false],
  ["distanceFare", false],
  ["timeCharge", false],
  ["permitCharge", false],
];

function stringValue(formData: FormData, key: TripField): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function isValidTime(value: string): boolean {
  return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function validateTripForm(formData: FormData): TripValidationResult {
  const fieldErrors: TripValidationResult["fieldErrors"] = {};
  const text = {
    tripId: stringValue(formData, "tripId").toUpperCase(),
    date: stringValue(formData, "date"),
    time: stringValue(formData, "time"),
    driverName: stringValue(formData, "driverName"),
    taxiNumber: stringValue(formData, "taxiNumber"),
    passengerName: stringValue(formData, "passengerName"),
    pickupLocation: stringValue(formData, "pickupLocation"),
    pickupTime: stringValue(formData, "pickupTime"),
    dropoffLocation: stringValue(formData, "dropoffLocation"),
    dropoffTime: stringValue(formData, "dropoffTime"),
    paymentMethod: stringValue(formData, "paymentMethod"),
  };

  for (const [field, message] of requiredFields) {
    if (!text[field as keyof typeof text]) fieldErrors[field] = message;
  }

  if (text.date && !isValidDate(text.date)) fieldErrors.date = "Enter a valid date.";
  for (const field of ["time", "pickupTime", "dropoffTime"] as const) {
    if (!isValidTime(text[field])) fieldErrors[field] = "Enter a valid time.";
  }

  if (!PAYMENT_METHODS.includes(text.paymentMethod as (typeof PAYMENT_METHODS)[number])) {
    fieldErrors.paymentMethod = "Choose a valid payment method.";
  }

  const numbers: Record<string, number> = {};
  for (const [field, required] of numberFields) {
    const raw = stringValue(formData, field);
    if (required && raw === "") {
      fieldErrors[field] = field === "distanceKm" ? "Distance is required." : "This field is required.";
      continue;
    }
    const value = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(value)) fieldErrors[field] = "Enter a valid number.";
    else if (value < 0) fieldErrors[field] = "Value cannot be negative.";
    else numbers[field] = value;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const fares = {
    baseFare: numbers.baseFare ?? 0,
    distanceFare: numbers.distanceFare ?? 0,
    timeCharge: numbers.timeCharge ?? 0,
    permitCharge: numbers.permitCharge ?? 0,
  };

  return {
    fieldErrors,
    data: {
      ...text,
      paymentMethod: text.paymentMethod as TripInput["paymentMethod"],
      distanceKm: numbers.distanceKm ?? 0,
      ...fares,
      // Assigned here only to keep all numeric normalization together; the repository
      // still calculates and stores the authoritative net fare.
    },
  };
}

export function authoritativeNetFare(input: TripInput): number {
  return calculateNetFare(input);
}
