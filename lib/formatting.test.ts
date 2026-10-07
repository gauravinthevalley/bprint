import { describe, expect, it } from "vitest";

import {
  calculateDistanceFare,
  calculateNetFare,
  formatCurrency,
  formatReceiptDate,
} from "@/lib/formatting";

describe("formatting", () => {
  it("formats Nepalese rupee values with separators", () => {
    expect(formatCurrency(2185)).toBe("Rs. 2,185");
    expect(formatCurrency(12500)).toBe("Rs. 12,500");
  });

  it("formats ISO dates as DD/MM/YYYY without timezone conversion", () => {
    expect(formatReceiptDate("2026-03-23")).toBe("23/03/2026");
  });

  it("calculates distance fare from the base fare and per-kilometre rate", () => {
    expect(calculateDistanceFare({ baseFare: 80, distanceKm: 11.3, farePerKm: 55 })).toBe(701.5);
  });

  it("calculates net fare without counting the base fare twice", () => {
    expect(calculateNetFare({ distanceFare: 701.5, timeCharge: 200, permitCharge: 160 })).toBe(
      1061.5,
    );
  });

  it("rounds calculated money to two decimal places", () => {
    expect(calculateDistanceFare({ baseFare: 80, distanceKm: 1.111, farePerKm: 55.55 })).toBe(
      141.72,
    );
  });
});
