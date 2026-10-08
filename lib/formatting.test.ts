import { describe, expect, it } from "vitest";

import {
  calculateDistanceFare,
  calculateNetFare,
  calculateReceiptNetFare,
  formatCurrency,
  formatReceiptDate,
  formatReceiptTime,
} from "@/lib/formatting";

describe("formatting", () => {
  it("formats Nepalese rupee values with separators", () => {
    expect(formatCurrency(2185)).toBe("Rs. 2,185");
    expect(formatCurrency(12500)).toBe("Rs. 12,500");
  });

  it("formats ISO dates as DD/MM/YYYY without timezone conversion", () => {
    expect(formatReceiptDate("2026-03-23")).toBe("23/03/2026");
  });

  it("formats receipt times using a 12-hour clock", () => {
    expect(formatReceiptTime("07:16")).toBe("7:16 AM");
    expect(formatReceiptTime("21:16")).toBe("9:16 PM");
    expect(formatReceiptTime("00:05")).toBe("12:05 AM");
    expect(formatReceiptTime("12:00")).toBe("12:00 PM");
    expect(formatReceiptTime("invalid")).toBe("invalid");
  });

  it("calculates distance fare from the base fare and per-kilometre rate", () => {
    expect(calculateDistanceFare({ baseFare: 80, distanceKm: 11.3, farePerKm: 55 })).toBe(701.5);
  });

  it("calculates the saved net fare without adding the base fare again", () => {
    expect(calculateNetFare({ distanceFare: 701.5, timeCharge: 200, permitCharge: 160 })).toBe(
      1061.5,
    );
  });

  it("adds the base fare only to the displayed receipt total", () => {
    expect(calculateReceiptNetFare({ baseFare: 80, netFare: 1180 })).toBe(1260);
    expect(calculateReceiptNetFare({ baseFare: 80, netFare: 1220 })).toBe(1300);
  });

  it("rounds calculated money to two decimal places", () => {
    expect(calculateDistanceFare({ baseFare: 80, distanceKm: 1.111, farePerKm: 55.55 })).toBe(
      141.72,
    );
  });
});
