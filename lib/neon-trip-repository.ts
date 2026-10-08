import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

import type { TripRepository } from "@/lib/trip-repository";
import { authoritativeDistanceFare } from "@/lib/trip-validation";
import type { CreateTripInput, Trip, UpdateTripInput } from "@/types/trip";

export type SqlQuery = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Record<string, unknown>[]>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createNeonQuery(connectionString: string): SqlQuery {
  const sql = neon(connectionString);
  return async (strings, ...values) =>
    (await sql(strings, ...values)) as Record<string, unknown>[];
}

function stringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

function numberValue(value: unknown): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("Neon returned an invalid numeric trip value.");
  return number;
}

function nullableNumberValue(value: unknown): number | null {
  return value == null ? null : numberValue(value);
}

function timestampValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const date = new Date(stringValue(value));
  if (Number.isNaN(date.valueOf())) throw new Error("Neon returned an invalid trip timestamp.");
  return date.toISOString();
}

export function mapTripRow(row: Record<string, unknown>): Trip {
  return {
    id: stringValue(row.id),
    tripId: stringValue(row.tripId),
    date: stringValue(row.date).slice(0, 10),
    time: stringValue(row.time).slice(0, 5),
    driverName: stringValue(row.driverName),
    taxiNumber: stringValue(row.taxiNumber),
    passengerName: stringValue(row.passengerName),
    pickupLocation: stringValue(row.pickupLocation),
    pickupTime: stringValue(row.pickupTime).slice(0, 5),
    dropoffLocation: stringValue(row.dropoffLocation),
    dropoffTime: stringValue(row.dropoffTime).slice(0, 5),
    paymentMethod: stringValue(row.paymentMethod) as Trip["paymentMethod"],
    distanceKm: numberValue(row.distanceKm),
    farePerKm: nullableNumberValue(row.farePerKm),
    baseFare: numberValue(row.baseFare),
    distanceFare: numberValue(row.distanceFare),
    timeCharge: numberValue(row.timeCharge),
    permitCharge: numberValue(row.permitCharge),
    netFare: numberValue(row.netFare),
    createdAt: timestampValue(row.createdAt),
    updatedAt: timestampValue(row.updatedAt),
  };
}

export class NeonTripRepository implements TripRepository {
  constructor(private readonly sql: SqlQuery) {}

  async getTrips(userId: string): Promise<Trip[]> {
    const rows = await this.sql`
      SELECT
        id::text AS id,
        trip_id AS "tripId",
        date::text AS date,
        time::text AS time,
        driver_name AS "driverName",
        taxi_number AS "taxiNumber",
        passenger_name AS "passengerName",
        pickup_location AS "pickupLocation",
        pickup_time::text AS "pickupTime",
        dropoff_location AS "dropoffLocation",
        dropoff_time::text AS "dropoffTime",
        payment_method AS "paymentMethod",
        distance_km AS "distanceKm",
        fare_per_km AS "farePerKm",
        base_fare AS "baseFare",
        distance_fare AS "distanceFare",
        time_charge AS "timeCharge",
        permit_charge AS "permitCharge",
        net_fare AS "netFare",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM trips
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return rows.map(mapTripRow);
  }

  async getTrip(userId: string, id: string): Promise<Trip | null> {
    if (!uuidPattern.test(id)) return null;
    const rows = await this.sql`
      SELECT
        id::text AS id,
        trip_id AS "tripId",
        date::text AS date,
        time::text AS time,
        driver_name AS "driverName",
        taxi_number AS "taxiNumber",
        passenger_name AS "passengerName",
        pickup_location AS "pickupLocation",
        pickup_time::text AS "pickupTime",
        dropoff_location AS "dropoffLocation",
        dropoff_time::text AS "dropoffTime",
        payment_method AS "paymentMethod",
        distance_km AS "distanceKm",
        fare_per_km AS "farePerKm",
        base_fare AS "baseFare",
        distance_fare AS "distanceFare",
        time_charge AS "timeCharge",
        permit_charge AS "permitCharge",
        net_fare AS "netFare",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM trips
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;
    return rows[0] ? mapTripRow(rows[0]) : null;
  }

  async createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
    const id = randomUUID();
    const tripId = input.tripId || randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const distanceFare = authoritativeDistanceFare(input);
    const rows = await this.sql`
      INSERT INTO trips (
        id, user_id, trip_id, date, time, driver_name, taxi_number, passenger_name,
        pickup_location, pickup_time, dropoff_location, dropoff_time,
        payment_method, distance_km, fare_per_km, base_fare, distance_fare, time_charge, permit_charge
      ) VALUES (
        ${id}, ${userId}, ${tripId}, ${input.date}, ${input.time || null}, ${input.driverName},
        ${input.taxiNumber}, ${input.passengerName}, ${input.pickupLocation},
        ${input.pickupTime || null}, ${input.dropoffLocation}, ${input.dropoffTime || null},
        ${input.paymentMethod}, ${input.distanceKm}, ${input.farePerKm}, ${input.baseFare}, ${distanceFare},
        ${input.timeCharge}, ${input.permitCharge}
      )
      RETURNING
        id::text AS id, trip_id AS "tripId", date::text AS date, time::text AS time,
        driver_name AS "driverName", taxi_number AS "taxiNumber",
        passenger_name AS "passengerName", pickup_location AS "pickupLocation",
        pickup_time::text AS "pickupTime", dropoff_location AS "dropoffLocation",
        dropoff_time::text AS "dropoffTime", payment_method AS "paymentMethod",
        distance_km AS "distanceKm", fare_per_km AS "farePerKm", base_fare AS "baseFare",
        distance_fare AS "distanceFare", time_charge AS "timeCharge",
        permit_charge AS "permitCharge", net_fare AS "netFare",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    if (!rows[0]) throw new Error("Neon did not return the created trip.");
    return mapTripRow(rows[0]);
  }

  async updateTrip(userId: string, id: string, input: UpdateTripInput): Promise<Trip | null> {
    if (!uuidPattern.test(id)) return null;
    const distanceFare = authoritativeDistanceFare(input);
    const rows = await this.sql`
      UPDATE trips SET
        trip_id = ${input.tripId}, date = ${input.date}, time = ${input.time || null},
        driver_name = ${input.driverName}, taxi_number = ${input.taxiNumber},
        passenger_name = ${input.passengerName}, pickup_location = ${input.pickupLocation},
        pickup_time = ${input.pickupTime || null}, dropoff_location = ${input.dropoffLocation},
        dropoff_time = ${input.dropoffTime || null}, payment_method = ${input.paymentMethod},
        distance_km = ${input.distanceKm}, fare_per_km = ${input.farePerKm},
        base_fare = ${input.baseFare}, distance_fare = ${distanceFare}, time_charge = ${input.timeCharge},
        permit_charge = ${input.permitCharge}, updated_at = now()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING
        id::text AS id, trip_id AS "tripId", date::text AS date, time::text AS time,
        driver_name AS "driverName", taxi_number AS "taxiNumber",
        passenger_name AS "passengerName", pickup_location AS "pickupLocation",
        pickup_time::text AS "pickupTime", dropoff_location AS "dropoffLocation",
        dropoff_time::text AS "dropoffTime", payment_method AS "paymentMethod",
        distance_km AS "distanceKm", fare_per_km AS "farePerKm", base_fare AS "baseFare",
        distance_fare AS "distanceFare", time_charge AS "timeCharge",
        permit_charge AS "permitCharge", net_fare AS "netFare",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return rows[0] ? mapTripRow(rows[0]) : null;
  }

  async deleteTrip(userId: string, id: string): Promise<boolean> {
    if (!uuidPattern.test(id)) return false;
    const rows = await this.sql`
      DELETE FROM trips
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id::text AS id
    `;
    return rows.length > 0;
  }

  async deleteTrips(userId: string, ids: string[]): Promise<number> {
    const validIds = [...new Set(ids)].filter((id) => uuidPattern.test(id));
    if (validIds.length === 0) return 0;

    const rows = await this.sql`
      DELETE FROM trips
      WHERE user_id = ${userId} AND id = ANY(${validIds}::uuid[])
      RETURNING id::text AS id
    `;
    return rows.length;
  }

  async deleteAllTrips(userId: string): Promise<number> {
    const rows = await this.sql`
      DELETE FROM trips WHERE user_id = ${userId}
      RETURNING id::text AS id
    `;
    return rows.length;
  }
}
