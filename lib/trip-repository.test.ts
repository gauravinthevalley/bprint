import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTripRepository, JsonTripRepository } from "@/lib/trip-repository";
import { NeonTripRepository, type SqlQuery } from "@/lib/neon-trip-repository";
import type { TripInput } from "@/types/trip";

const temporaryDirectories: string[] = [];
const userId = "user-one";
const otherUserId = "user-two";

const input: TripInput = {
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
  distanceKm: 11.3,
  farePerKm: 55,
  baseFare: 80,
  timeCharge: 200,
  permitCharge: 160,
};

async function repository() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "trip-repository-"));
  temporaryDirectories.push(directory);
  return {
    repository: new JsonTripRepository(path.join(directory, "nested", "trips.json")),
    filePath: path.join(directory, "nested", "trips.json"),
  };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe("JsonTripRepository", () => {
  it("initializes missing storage and persists a generated id and authoritative total", async () => {
    const setup = await repository();
    const created = await setup.repository.createTrip(userId, input);

    expect(created.id).toBeTruthy();
    expect(created.tripId).toMatch(/^[A-F0-9]{6}$/);
    expect(created.distanceFare).toBe(701.5);
    expect(created.netFare).toBe(1061.5);
    expect(await setup.repository.getTrip(userId, created.id)).toEqual(created);
    expect(await setup.repository.getTrip(otherUserId, created.id)).toBeNull();
    expect(JSON.parse(await readFile(setup.filePath, "utf8"))).toHaveLength(1);
  });

  it("updates a saved trip without changing its record id or creation time", async () => {
    const setup = await repository();
    const created = await setup.repository.createTrip(userId, input);
    expect(
      await setup.repository.updateTrip(otherUserId, created.id, {
        ...input,
        passengerName: "Wrong account",
      }),
    ).toBeNull();
    const updated = await setup.repository.updateTrip(userId, created.id, {
      ...input,
      tripId: created.tripId,
      passengerName: "Updated Passenger",
      baseFare: 200,
    });

    expect(updated?.id).toBe(created.id);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.passengerName).toBe("Updated Passenger");
    expect(updated?.distanceFare).toBe(821.5);
    expect(updated?.netFare).toBe(1181.5);
  });

  it("loads legacy JSON trips without changing their historical fares", async () => {
    const setup = await repository();
    const created = await setup.repository.createTrip(userId, input);
    const [stored] = JSON.parse(await readFile(setup.filePath, "utf8"));
    delete stored.farePerKm;
    stored.distanceFare = 1700;
    stored.netFare = 2185;
    await writeFile(setup.filePath, `${JSON.stringify([stored], null, 2)}\n`, "utf8");

    const legacyTrip = await setup.repository.getTrip(userId, created.id);
    expect(legacyTrip?.farePerKm).toBeNull();
    expect(legacyTrip?.distanceFare).toBe(1700);
    expect(legacyTrip?.netFare).toBe(2185);
  });

  it("returns null for an unknown trip", async () => {
    const setup = await repository();
    expect(await setup.repository.getTrip(userId, "missing")).toBeNull();
    expect(await setup.repository.updateTrip(userId, "missing", input)).toBeNull();
  });

  it("deletes a saved trip and reports missing records", async () => {
    const setup = await repository();
    const created = await setup.repository.createTrip(userId, input);

    expect(await setup.repository.deleteTrip(otherUserId, created.id)).toBe(false);
    expect(await setup.repository.deleteTrip(userId, created.id)).toBe(true);
    expect(await setup.repository.getTrip(userId, created.id)).toBeNull();
    expect(await setup.repository.deleteTrip(userId, created.id)).toBe(false);
    expect(JSON.parse(await readFile(setup.filePath, "utf8"))).toEqual([]);
  });

  it("deletes selected trips and then all remaining trips", async () => {
    const setup = await repository();
    const first = await setup.repository.createTrip(userId, input);
    const second = await setup.repository.createTrip(userId, input);
    const third = await setup.repository.createTrip(userId, input);
    const other = await setup.repository.createTrip(otherUserId, input);

    expect(
      await setup.repository.deleteTrips(userId, [first.id, third.id, other.id, first.id, "missing"]),
    ).toBe(2);
    expect((await setup.repository.getTrips(userId)).map((trip) => trip.id)).toEqual([second.id]);
    expect(await setup.repository.deleteAllTrips(userId)).toBe(1);
    expect(await setup.repository.getTrips(userId)).toEqual([]);
    expect((await setup.repository.getTrips(otherUserId)).map((trip) => trip.id)).toEqual([other.id]);
    expect(await setup.repository.deleteAllTrips(userId)).toBe(0);
  });
});

describe("repository selection", () => {
  it("selects Neon when DATABASE_URL is configured", () => {
    const query: SqlQuery = async () => [];
    const selected = createTripRepository({
      databaseUrl: "postgresql://example.invalid/database",
      neonQuery: query,
    });
    expect(selected).toBeInstanceOf(NeonTripRepository);
  });

  it("uses JSON locally and rejects a Vercel deployment without Neon", async () => {
    const setup = await repository();
    expect(
      createTripRepository({ databaseUrl: "", isVercel: false, jsonFilePath: setup.filePath }),
    ).toBeInstanceOf(JsonTripRepository);
    expect(() => createTripRepository({ databaseUrl: "", isVercel: true })).toThrow(
      "DATABASE_URL is required on Vercel",
    );
  });
});
