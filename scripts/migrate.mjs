import { readdir, readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const sql = neon(databaseUrl);
await sql.query(`
  CREATE TABLE IF NOT EXISTS bprint_schema_migrations (
    name text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const migrationsDirectory = new URL("../database/", import.meta.url);
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((name) => /^\d+_.+\.sql$/.test(name))
  .sort();
const appliedRows = await sql.query("SELECT name FROM bprint_schema_migrations");
const applied = new Set(appliedRows.map((row) => String(row.name)));

for (const name of migrationFiles) {
  if (applied.has(name)) continue;

  const migration = await readFile(new URL(name, migrationsDirectory), "utf8");
  const statements = migration
    .split(/;\s*(?:\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
  }

  await sql`INSERT INTO bprint_schema_migrations (name) VALUES (${name}) ON CONFLICT DO NOTHING`;
  console.log(`Applied migration ${name}.`);
}

console.log("Database migrations completed.");
