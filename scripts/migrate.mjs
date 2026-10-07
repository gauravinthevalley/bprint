import { readFile } from "node:fs/promises";

import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run database migrations.");
}

const migration = await readFile(
  new URL("../database/001_create_trips.sql", import.meta.url),
  "utf8",
);
const sql = neon(databaseUrl);
const statements = migration
  .split(/;\s*(?:\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log("Database migrations completed.");
