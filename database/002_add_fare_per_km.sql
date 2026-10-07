ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS fare_per_km numeric(12, 2) CHECK (fare_per_km >= 0);

ALTER TABLE trips DROP COLUMN IF EXISTS net_fare;

ALTER TABLE trips
  ADD COLUMN net_fare numeric(14, 2) GENERATED ALWAYS AS (
    CASE
      WHEN fare_per_km IS NULL THEN base_fare + distance_fare + time_charge + permit_charge
      ELSE distance_fare + time_charge + permit_charge
    END
  ) STORED;
