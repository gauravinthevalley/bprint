CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY,
  trip_id varchar(32) NOT NULL UNIQUE,
  date date NOT NULL,
  time time,
  driver_name text NOT NULL,
  taxi_number text NOT NULL,
  passenger_name text NOT NULL DEFAULT '',
  pickup_location text NOT NULL,
  pickup_time time,
  dropoff_location text NOT NULL,
  dropoff_time time,
  payment_method varchar(16) NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'Online', 'Other')),
  distance_km numeric(10, 2) NOT NULL CHECK (distance_km >= 0),
  fare_per_km numeric(12, 2) CHECK (fare_per_km >= 0),
  base_fare numeric(12, 2) NOT NULL DEFAULT 0 CHECK (base_fare >= 0),
  distance_fare numeric(12, 2) NOT NULL DEFAULT 0 CHECK (distance_fare >= 0),
  time_charge numeric(12, 2) NOT NULL DEFAULT 0 CHECK (time_charge >= 0),
  permit_charge numeric(12, 2) NOT NULL DEFAULT 0 CHECK (permit_charge >= 0),
  net_fare numeric(14, 2) GENERATED ALWAYS AS (
    CASE
      WHEN fare_per_km IS NULL THEN base_fare + distance_fare + time_charge + permit_charge
      ELSE distance_fare + time_charge + permit_charge
    END
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trips_created_at_idx ON trips (created_at DESC);
