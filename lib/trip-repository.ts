import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { createNeonQuery, NeonTripRepository, type SqlQuery } from "@/lib/neon-trip-repository";
import { authoritativeDistanceFare, authoritativeNetFare } from "@/lib/trip-validation";
import type { CreateTripInput, Trip, UpdateTripInput } from "@/types/trip";

export interface TripRepository {
  getTrips(): Promise<Trip[]>;
  getTrip(id: string): Promise<Trip | null>;
  createTrip(input: CreateTripInput): Promise<Trip>;
  updateTrip(id: string, input: UpdateTripInput): Promise<Trip | null>;
  deleteTrip(id: string): Promise<boolean>;
}

export class JsonTripRepository implements TripRepository {
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async getTrips(): Promise<Trip[]> {
    const trips = await this.readTrips();
    return trips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getTrip(id: string): Promise<Trip | null> {
    const trips = await this.readTrips();
    return trips.find((trip) => trip.id === id) ?? null;
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const now = new Date().toISOString();
      const trip: Trip = {
        ...input,
        id: randomUUID(),
        tripId: input.tripId || this.generateTripId(trips),
        distanceFare: authoritativeDistanceFare(input),
        netFare: authoritativeNetFare(input),
        createdAt: now,
        updatedAt: now,
      };
      trips.push(trip);
      await this.writeTrips(trips);
      return trip;
    });
  }

  async updateTrip(id: string, input: UpdateTripInput): Promise<Trip | null> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const index = trips.findIndex((trip) => trip.id === id);
      if (index < 0) return null;

      const current = trips[index];
      const updated: Trip = {
        ...input,
        id: current.id,
        tripId: input.tripId || current.tripId || this.generateTripId(trips),
        distanceFare: authoritativeDistanceFare(input),
        netFare: authoritativeNetFare(input),
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
      };
      trips[index] = updated;
      await this.writeTrips(trips);
      return updated;
    });
  }

  async deleteTrip(id: string): Promise<boolean> {
    return this.withWriteLock(async () => {
      const trips = await this.readTrips();
      const index = trips.findIndex((trip) => trip.id === id);
      if (index < 0) return false;

      trips.splice(index, 1);
      await this.writeTrips(trips);
      return true;
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

  private async readTrips(): Promise<Trip[]> {
    await this.ensureFile();
    const contents = await readFile(this.filePath, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (!Array.isArray(parsed)) {
      throw new Error(`Trip data at ${this.filePath} must contain a JSON array.`);
    }
    return (parsed as Array<Trip & { farePerKm?: number | null }>).map((trip) => ({
      ...trip,
      farePerKm: typeof trip.farePerKm === "number" ? trip.farePerKm : null,
    }));
  }

  private async writeTrips(trips: Trip[]): Promise<void> {
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

// Local development uses JSON by default. Vercel must provide DATABASE_URL through Neon.
// Components and server actions continue to depend only on the repository interface.
export const tripRepository: TripRepository = createTripRepository();

export const getTrips = () => tripRepository.getTrips();
export const getTrip = (id: string) => tripRepository.getTrip(id);
export const createTrip = (input: CreateTripInput) => tripRepository.createTrip(input);
export const updateTrip = (id: string, input: UpdateTripInput) =>
  tripRepository.updateTrip(id, input);
export const deleteTrip = (id: string) => tripRepository.deleteTrip(id);
