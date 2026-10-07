import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createTripRepository, JsonTripRepository } from "@/lib/trip-repository";
import { NeonTripRepository, type SqlQuery } from "@/lib/neon-trip-repository";
import type { TripInput } from "@/types/trip";

const temporaryDirectories: string[] = [];

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
  baseFare: 125,
  distanceFare: 1700,
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
    const created = await setup.repository.createTrip(input);

    expect(created.id).toBeTruthy();
    expect(created.tripId).toMatch(/^[A-F0-9]{6}$/);
    expect(created.netFare).toBe(2185);
    expect(await setup.repository.getTrip(created.id)).toEqual(created);
    expect(JSON.parse(await readFile(setup.filePath, "utf8"))).toHaveLength(1);
  });

  it("updates a saved trip without changing its record id or creation time", async () => {
    const setup = await repository();
    const created = await setup.repository.createTrip(input);
    const updated = await setup.repository.updateTrip(created.id, {
      ...input,
      tripId: created.tripId,
      passengerName: "Updated Passenger",
      baseFare: 200,
    });

    expect(updated?.id).toBe(created.id);
    expect(updated?.createdAt).toBe(created.createdAt);
    expect(updated?.passengerName).toBe("Updated Passenger");
    expect(updated?.netFare).toBe(2260);
  });

  it("returns null for an unknown trip", async () => {
    const setup = await repository();
    expect(await setup.repository.getTrip("missing")).toBeNull();
    expect(await setup.repository.updateTrip("missing", input)).toBeNull();
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
