import { describe, expect, it } from "vitest";

import { validateTripForm } from "@/lib/trip-validation";

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
    baseFare: "125",
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
  });

  it("rejects missing required fields and negative numbers", () => {
    const data = validFormData();
    data.set("driverName", "");
    data.set("distanceFare", "-1");
    const result = validateTripForm(data);
    expect(result.fieldErrors.driverName).toBeDefined();
    expect(result.fieldErrors.distanceFare).toBe("Value cannot be negative.");
  });

  it("treats blank optional charges as zero", () => {
    const data = validFormData();
    data.set("permitCharge", "");
    expect(validateTripForm(data).data?.permitCharge).toBe(0);
  });
});
