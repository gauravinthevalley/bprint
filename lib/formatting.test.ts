import { describe, expect, it } from "vitest";

import { calculateNetFare, formatCurrency, formatReceiptDate } from "@/lib/formatting";

describe("formatting", () => {
  it("formats Nepalese rupee values with separators", () => {
    expect(formatCurrency(2185)).toBe("Rs. 2,185");
    expect(formatCurrency(12500)).toBe("Rs. 12,500");
  });

  it("formats ISO dates as DD/MM/YYYY without timezone conversion", () => {
    expect(formatReceiptDate("2026-03-23")).toBe("23/03/2026");
  });

  it("calculates the net fare", () => {
    expect(
      calculateNetFare({ baseFare: 125, distanceFare: 1700, timeCharge: 200, permitCharge: 160 }),
    ).toBe(2185);
  });
});
