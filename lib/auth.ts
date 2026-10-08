import { Pool } from "pg";
import { betterAuth } from "better-auth";

const databaseUrl = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for authentication.");
}
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required for authentication.");
}
if (!baseURL) {
  throw new Error("BETTER_AUTH_URL is required for authentication.");
}

const globalForAuth = globalThis as unknown as { bprintAuthPool?: Pool };

const pool =
  globalForAuth.bprintAuthPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 5,
  });

globalForAuth.bprintAuthPool = pool;

export const auth = betterAuth({
  secret,
  baseURL,
  database: pool,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 180,
    disableSessionRefresh: true,
  },
});
