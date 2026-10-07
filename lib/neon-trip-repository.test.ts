import { describe, expect, it, vi } from "vitest";

import {
  mapTripRow,
  NeonTripRepository,
  type SqlQuery,
} from "@/lib/neon-trip-repository";
import type { TripInput } from "@/types/trip";

const id = "3c4c4eb1-eda0-4e6d-a1c0-dac71b890c52";

const databaseRow: Record<string, unknown> = {
  id,
  tripId: "12CTT9",
  date: "2026-03-23",
  time: "08:20:00",
  driverName: "Lal Bahadur Waiba",
  taxiNumber: "BA 2 Ja 7260",
  passengerName: "Nisha Pandey",
  pickupLocation: "Lakpa Marg, Kathmandu",
  pickupTime: "08:20:00",
  dropoffLocation: "CEHRD, Kathmandu",
  dropoffTime: "09:11:00",
  paymentMethod: "Cash",
  distanceKm: "11.30",
  baseFare: "125.00",
  distanceFare: "1700.00",
  timeCharge: "200.00",
  permitCharge: "160.00",
  netFare: "2185.00",
  createdAt: "2026-03-23T02:35:00.000Z",
  updatedAt: new Date("2026-03-23T02:35:00.000Z"),
};

const input: TripInput = {
  tripId: "12CTT9",
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
  distanceKm: 11.3,
  baseFare: 125,
  distanceFare: 1700,
  timeCharge: 200,
  permitCharge: 160,
};

function queryReturning(rows: Record<string, unknown>[]) {
  return vi.fn<SqlQuery>(async () => rows);
}

describe("NeonTripRepository", () => {
  it("maps Postgres values into the Trip shape", () => {
    const trip = mapTripRow(databaseRow);
    expect(trip.distanceKm).toBe(11.3);
    expect(trip.netFare).toBe(2185);
    expect(trip.time).toBe("08:20");
    expect(trip.updatedAt).toBe("2026-03-23T02:35:00.000Z");
  });

  it("lists trips returned in database order", async () => {
    const query = queryReturning([databaseRow]);
    const trips = await new NeonTripRepository(query).getTrips();
    expect(trips).toHaveLength(1);
    expect(trips[0]?.tripId).toBe("12CTT9");
    expect(query).toHaveBeenCalledOnce();
  });

  it("returns null for malformed or missing ids", async () => {
    const query = queryReturning([]);
    const repository = new NeonTripRepository(query);
    expect(await repository.getTrip("not-a-uuid")).toBeNull();
    expect(query).not.toHaveBeenCalled();
    expect(await repository.getTrip(id)).toBeNull();
    expect(query).toHaveBeenCalledOnce();
  });

  it("creates and updates trips through parameterized queries", async () => {
    const query = queryReturning([databaseRow]);
    const repository = new NeonTripRepository(query);
    expect((await repository.createTrip(input)).netFare).toBe(2185);
    expect((await repository.updateTrip(id, input))?.id).toBe(id);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("returns null when an update finds no record", async () => {
    const query = queryReturning([]);
    expect(await new NeonTripRepository(query).updateTrip(id, input)).toBeNull();
  });
});
