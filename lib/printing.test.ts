import { describe, expect, it } from "vitest";

import { createPrintSheets, selectTripsForPrint } from "@/lib/printing";
import type { Trip } from "@/types/trip";

function trip(id: string): Trip {
  return {
    id,
    tripId: id.toUpperCase(),
    date: "2026-10-07",
    time: "08:00",
    driverName: "Driver",
    taxiNumber: "BA 1 JA 1000",
    passengerName: "Passenger",
    pickupLocation: "Pickup",
    pickupTime: "08:00",
    dropoffLocation: "Drop Off",
    dropoffTime: "09:00",
    paymentMethod: "Cash",
    distanceKm: 10,
    farePerKm: 55,
    baseFare: 100,
    distanceFare: 500,
    timeCharge: 0,
    permitCharge: 0,
    netFare: 600,
    createdAt: "2026-10-07T00:00:00.000Z",
    updatedAt: "2026-10-07T00:00:00.000Z",
  };
}

describe("print sheet pagination", () => {
  it.each([
    [0, 0],
    [1, 1],
    [3, 1],
    [6, 1],
    [7, 2],
    [27, 5],
  ])("places %i trips on %i sheets", (tripCount, sheetCount) => {
    const sheets = createPrintSheets(Array.from({ length: tripCount }, (_, index) => index));
    expect(sheets).toHaveLength(sheetCount);
    expect(sheets.every((sheet) => sheet.length === 6)).toBe(true);
  });

  it("leaves three blank slots after 27 trips", () => {
    const sheets = createPrintSheets(Array.from({ length: 27 }, (_, index) => index));
    expect(sheets.at(-1)?.filter((item) => item === null)).toHaveLength(3);
  });
});

describe("trip print selection", () => {
  const trips = [trip("newest"), trip("middle"), trip("oldest")];

  it("preserves list order, removes duplicate ids, and ignores unknown ids", () => {
    const selected = selectTripsForPrint(trips, {
      printAll: false,
      ids: ["oldest", "missing", "newest", "oldest"],
    });
    expect(selected.map(({ id }) => id)).toEqual(["newest", "oldest"]);
  });

  it("returns every trip in all-trip mode", () => {
    expect(selectTripsForPrint(trips, { printAll: true, ids: [] })).toEqual(trips);
  });
});
