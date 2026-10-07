import { describe, expect, it } from "vitest";

import {
  authoritativeDistanceFare,
  authoritativeNetFare,
  validateTripForm,
} from "@/lib/trip-validation";

function validFormData(): FormData {
  const data = new FormData();
  const values = {
    tripId: "",
    date: "2026-03-23",
    time: "08:20",
    driverName: "Lal Bahadur Waiba",
    taxiNumber: "BA 2 Ja 7260",
    passengerName: "Nisha Pandey",
    pickupLocation: "Lakpa Marg, Kathmandu",
    pickupTime: "08:20",
    dropoffLocation: "CEHRD, Kathmandu",
    dropoffTime: "09:11",
    paymentMethod: "Cash",
    distanceKm: "11.3",
    farePerKm: "55",
    baseFare: "80",
    distanceFare: "1700",
    timeCharge: "200",
    permitCharge: "160",
  };
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("trip form validation", () => {
  it("normalizes valid data and allows decimal distance", () => {
    const result = validateTripForm(validFormData());
    expect(result.fieldErrors).toEqual({});
    expect(result.data?.distanceKm).toBe(11.3);
    expect(result.data && authoritativeDistanceFare(result.data)).toBe(701.5);
    expect(result.data && authoritativeNetFare(result.data)).toBe(1061.5);
  });

  it("rejects missing required fields and negative numbers", () => {
    const data = validFormData();
    data.set("driverName", "");
    data.set("farePerKm", "-1");
    const result = validateTripForm(data);
    expect(result.fieldErrors.driverName).toBeDefined();
    expect(result.fieldErrors.farePerKm).toBe("Value cannot be negative.");
  });

  it("treats blank optional charges as zero", () => {
    const data = validFormData();
    data.set("permitCharge", "");
    expect(validateTripForm(data).data?.permitCharge).toBe(0);
  });

  it("requires a fare per KM and ignores a forged distance fare", () => {
    const missingRate = validFormData();
    missingRate.set("farePerKm", "");
    expect(validateTripForm(missingRate).fieldErrors.farePerKm).toBe("Fare per KM is required.");

    const forgedFare = validFormData();
    forgedFare.set("distanceFare", "999999");
    const result = validateTripForm(forgedFare);
    expect(result.data && authoritativeDistanceFare(result.data)).toBe(701.5);
  });
});
