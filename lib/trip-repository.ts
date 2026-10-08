import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { createNeonQuery, NeonTripRepository, type SqlQuery } from "@/lib/neon-trip-repository";
import { authoritativeDistanceFare, authoritativeNetFare } from "@/lib/trip-validation";
import type { CreateTripInput, Trip, UpdateTripInput } from "@/types/trip";

export interface TripRepository {
  getTrips(userId: string): Promise<Trip[]>;
  getTrip(userId: string, id: string): Promise<Trip | null>;
  createTrip(userId: string, input: CreateTripInput): Promise<Trip>;
  updateTrip(userId: string, id: string, input: UpdateTripInput): Promise<Trip | null>;
  deleteTrip(userId: string, id: string): Promise<boolean>;
  deleteTrips(userId: string, ids: string[]): Promise<number>;
  deleteAllTrips(userId: string): Promise<number>;
}

type StoredTrip = Trip & { userId: string };

function withoutOwner(storedTrip: StoredTrip): Trip {
  const trip: Partial<StoredTrip> = { ...storedTrip };
  delete trip.userId;
  return trip as Trip;
}

export class JsonTripRepository implements TripRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async getTrips(userId: string): Promise<Trip[]> {
    const trips = await this.readTrips();
    return trips
      .filter((trip) => trip.userId === userId)
      .map(withoutOwner)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getTrip(userId: string, id: string): Promise<Trip | null> {
    const trips = await this.readTrips();
    const trip = trips.find((candidate) => candidate.userId === userId && candidate.id === id);
    return trip ? withoutOwner(trip) : null;
  }

  async createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const now = new Date().toISOString();
      const trip: StoredTrip = {
        ...input,
        userId,
        id: randomUUID(),
        tripId: input.tripId || this.generateTripId(trips.filter((trip) => trip.userId === userId)),
        distanceFare: authoritativeDistanceFare(input),
        netFare: authoritativeNetFare(input),
        createdAt: now,
        updatedAt: now,
      };
      trips.push(trip);
      await this.writeTrips(trips);
      return withoutOwner(trip);
    });
  }

  async updateTrip(userId: string, id: string, input: UpdateTripInput): Promise<Trip | null> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const index = trips.findIndex((trip) => trip.userId === userId && trip.id === id);
      if (index < 0) return null;

      const current = trips[index];
      const updated: StoredTrip = {
        ...input,
        userId,
        id: current.id,
        tripId:
          input.tripId ||
          current.tripId ||
          this.generateTripId(trips.filter((trip) => trip.userId === userId)),
        distanceFare: authoritativeDistanceFare(input),
        netFare: authoritativeNetFare(input),
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      trips[index] = updated;
      await this.writeTrips(trips);
      return withoutOwner(updated);
    });
  }

  async deleteTrip(userId: string, id: string): Promise<boolean> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const index = trips.findIndex((trip) => trip.userId === userId && trip.id === id);
      if (index < 0) return false;

      trips.splice(index, 1);
      await this.writeTrips(trips);
      return true;
    });
  }

  async deleteTrips(userId: string, ids: string[]): Promise<number> {
    const idsToDelete = new Set(ids);
    if (idsToDelete.size === 0) return 0;

    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const remainingTrips = trips.filter(
        (trip) => trip.userId !== userId || !idsToDelete.has(trip.id),
      );
      const deletedCount = trips.length - remainingTrips.length;
      if (deletedCount > 0) await this.writeTrips(remainingTrips);
      return deletedCount;
    });
  }

  async deleteAllTrips(userId: string): Promise<number> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const remainingTrips = trips.filter((trip) => trip.userId !== userId);
      const deletedCount = trips.length - remainingTrips.length;
      if (deletedCount > 0) await this.writeTrips(remainingTrips);
      return deletedCount;
    });
  }

  private async ensureFile(): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await writeFile(this.filePath, "[]\n", "utf8");
    }
  }

  private async readTrips(): Promise<StoredTrip[]> {
    await this.ensureFile();
    const contents = await readFile(this.filePath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed)) {
      throw new Error(`Trip data at ${this.filePath} must contain a JSON array.`);
    }
    return (parsed as Array<StoredTrip & { farePerKm?: number | null }>).map((trip) => ({
      ...trip,
      farePerKm: typeof trip.farePerKm === "number" ? trip.farePerKm : null,
    }));
  }

  private async writeTrips(trips: StoredTrip[]): Promise<void> {
    const temporaryPath = `${this.filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(trips, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.filePath);
  }

  private generateTripId(trips: Trip[]): string {
    const existing = new Set(trips.map((trip) => trip.tripId));
    let candidate = "";
    do {
      candidate = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    } while (existing.has(candidate));
    return candidate;
  }

  private async withWriteLock<T>(operation: () => Promise<T>): Promise<T> {
    const previous = this.writeQueue;
    let release!: () => void;
    this.writeQueue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

interface RepositoryOptions {
  databaseUrl?: string;
  isVercel?: boolean;
  jsonFilePath?: string;
  neonQuery?: SqlQuery;
}

export function createTripRepository(options: RepositoryOptions = {}): TripRepository {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (databaseUrl) {
    return new NeonTripRepository(options.neonQuery ?? createNeonQuery(databaseUrl));
  }

  const isVercel = options.isVercel ?? process.env.VERCEL === "1";
  if (isVercel) {
    throw new Error(
      "DATABASE_URL is required on Vercel. Connect the Neon integration before deploying.",
    );
  }

  const jsonFilePath =
    options.jsonFilePath ??
    process.env.TRIPS_DATA_FILE ??
    path.join(process.cwd(), "data", "trips.json");
  return new JsonTripRepository(jsonFilePath);
}

// The JSON implementation is retained for local repository development and tests.
// The authenticated application and every Vercel deployment require Neon via DATABASE_URL.
export const tripRepository: TripRepository = createTripRepository();

export const getTrips = (userId: string) => tripRepository.getTrips(userId);
export const getTrip = (userId: string, id: string) => tripRepository.getTrip(userId, id);
export const createTrip = (userId: string, input: CreateTripInput) =>
  tripRepository.createTrip(userId, input);
export const updateTrip = (userId: string, id: string, input: UpdateTripInput) =>
  tripRepository.updateTrip(userId, id, input);
export const deleteTrip = (userId: string, id: string) => tripRepository.deleteTrip(userId, id);
export const deleteTrips = (userId: string, ids: string[]) =>
  tripRepository.deleteTrips(userId, ids);
export const deleteAllTrips = (userId: string) => tripRepository.deleteAllTrips(userId);
