import { describe, expect, it, vi } from "vitest";

import {
  mapTripRow,
  NeonTripRepository,
  type SqlQuery,
} from "@/lib/neon-trip-repository";
import type { TripInput } from "@/types/trip";

const id = "3c4c4eb1-eda0-4e6d-a1c0-dac71b890c52";
const userId = "user-one";

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
  farePerKm: "55.00",
  baseFare: "80.00",
  distanceFare: "701.50",
  timeCharge: "200.00",
  permitCharge: "160.00",
  netFare: "1061.50",
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
  farePerKm: 55,
  baseFare: 80,
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
    expect(trip.farePerKm).toBe(55);
    expect(trip.netFare).toBe(1061.5);
    expect(trip.time).toBe("08:20");
    expect(trip.updatedAt).toBe("2026-03-23T02:35:00.000Z");
  });

  it("lists trips returned in database order", async () => {
    const query = queryReturning([databaseRow]);
    const trips = await new NeonTripRepository(query).getTrips(userId);
    expect(trips).toHaveLength(1);
    expect(trips[0]?.tripId).toBe("12CTT9");
    expect(query).toHaveBeenCalledOnce();
    expect(query.mock.calls[0]?.slice(1)).toContain(userId);
  });

  it("returns null for malformed or missing ids", async () => {
    const query = queryReturning([]);
    const repository = new NeonTripRepository(query);
    expect(await repository.getTrip(userId, "not-a-uuid")).toBeNull();
    expect(query).not.toHaveBeenCalled();
    expect(await repository.getTrip(userId, id)).toBeNull();
    expect(query).toHaveBeenCalledOnce();
  });

  it("creates and updates trips through parameterized queries", async () => {
    const query = queryReturning([databaseRow]);
    const repository = new NeonTripRepository(query);
    expect((await repository.createTrip(userId, input)).netFare).toBe(1061.5);
    expect((await repository.updateTrip(userId, id, input))?.id).toBe(id);
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls.every((call) => call.slice(1).includes(userId))).toBe(true);
  });

  it("returns null when an update finds no record", async () => {
    const query = queryReturning([]);
    expect(await new NeonTripRepository(query).updateTrip(userId, id, input)).toBeNull();
  });

  it("deletes trips through a parameterized query", async () => {
    const query = queryReturning([{ id }]);
    const repository = new NeonTripRepository(query);
    expect(await repository.deleteTrip(userId, id)).toBe(true);
    expect(query).toHaveBeenCalledOnce();
  });

  it("does not query for malformed delete ids and reports missing rows", async () => {
    const query = queryReturning([]);
    const repository = new NeonTripRepository(query);
    expect(await repository.deleteTrip(userId, "not-a-uuid")).toBe(false);
    expect(query).not.toHaveBeenCalled();
    expect(await repository.deleteTrip(userId, id)).toBe(false);
  });

  it("bulk deletes selected trips", async () => {
    const query = queryReturning([{ id }, { id: "55be9c11-42c6-455a-898e-2a1d9beef64d" }]);
    const repository = new NeonTripRepository(query);
    expect(
      await repository.deleteTrips(userId, [
        id,
        id,
        "55be9c11-42c6-455a-898e-2a1d9beef64d",
        "not-a-uuid",
      ]),
    ).toBe(2);
    expect(query).toHaveBeenCalledOnce();
  });

  it("does not query when a selected deletion contains no valid ids", async () => {
    const query = queryReturning([]);
    expect(await new NeonTripRepository(query).deleteTrips(userId, ["invalid"])).toBe(0);
    expect(query).not.toHaveBeenCalled();
  });

  it("deletes every trip", async () => {
    const query = queryReturning([{ id }, { id: "55be9c11-42c6-455a-898e-2a1d9beef64d" }]);
    expect(await new NeonTripRepository(query).deleteAllTrips(userId)).toBe(2);
    expect(query).toHaveBeenCalledOnce();
  });

  it("maps legacy rows without a fare per KM", () => {
    expect(mapTripRow({ ...databaseRow, farePerKm: null, netFare: "2185.00" }).farePerKm).toBeNull();
  });
});
