# Travel Receipts

A small Next.js application for creating, saving, viewing, editing, and printing taxi or travel receipts. It uses the App Router, TypeScript, Tailwind CSS, server actions, Better Auth, and Neon Postgres.

## Install and run locally

Requirements: Node.js 20.9 or newer, npm, and a Neon Postgres database.

```bash
npm install
npm run db:migrate
npm run dev
```

First copy `.env.example` to `.env.local` and set:

```dotenv
DATABASE_URL=your-neon-connection-string
BETTER_AUTH_SECRET=a-random-secret-with-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000
```

Generate a suitable secret with `openssl rand -base64 32`. Open [http://localhost:3000](http://localhost:3000); the home page redirects to `/trips`, where you can create an account or sign in.

Other commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:migrate
npm start
```

## Authentication and data storage

Better Auth provides open email/password registration and secure cookie-based sessions. Email verification and password-reset email are intentionally not configured in this initial version. Sessions expire after 180 days and do not use browser local storage. Each repository operation is scoped to the signed-in user, so accounts cannot view, print, edit, or delete one another's trips.

Trips and authentication records are stored in Neon whenever `DATABASE_URL` is configured. The pages, forms, receipt components, and server actions do not access storage directly; they use the `TripRepository` abstraction. A future storage implementation can replace `lib/neon-trip-repository.ts` without changing the form or receipt components.

The project retains a local JSON implementation in `lib/trip-repository.ts` for repository development and tests. It initializes `data/trips.json` with an empty array, serializes writes, and uses temporary-file renames. The complete authenticated application requires Postgres because Better Auth stores users and sessions in the database.

For isolated repository test runs, set `TRIPS_DATA_FILE` to an alternate JSON file path.

> **Important:** JSON persistence is for local development only. Vercel functions do not provide a durable, shared writable filesystem. Records written this way can disappear between deployments or function invocations and are not safe across multiple server instances.

On Vercel, `DATABASE_URL`, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL` are required. The application fails with a clear configuration error rather than attempting to write to Vercel's read-only application filesystem.

## Deploying to Vercel

1. Open the Vercel project and select **Storage → Create Database → Neon**.
2. Create a Vercel-managed Neon database and connect it to the `bprint` project.
3. Enable **Production** and **Preview**, mark the integration as required, and enable a Neon branch for Preview deployments.
4. Confirm that the integration provides `DATABASE_URL` to both environments. Never commit its value.
5. Add `BETTER_AUTH_SECRET` (a separate strong random value per environment) and set `BETTER_AUTH_URL` to the deployment origin, such as `https://bprint-two.vercel.app`. Do not include `/trips` or a trailing path.
6. Redeploy the project. `vercel.json` runs `npm run db:migrate` before the Next.js build, creating the auth tables and user-owned trips schema on the environment's Neon branch.

Database migrations in `database/` run in filename order and are recorded in the `bprint_schema_migrations` table, so each migration is applied once. Preview branches are isolated from production and inherit the production schema at branch creation.

To use Neon locally, copy `.env.example` to `.env.local`, add a Neon connection string, and run:

```bash
npm run db:migrate
npm run dev
```

Migration `003_add_auth_and_trip_ownership.sql` intentionally deletes all trips created before authentication was added, then requires every new trip to belong to a user. Back up production first if those old rows need to be retained.

Registration is intentionally open: anyone who can reach the site can create an account and consume database storage. If that becomes undesirable, disable public sign-up or add an invitation/admin approval check. No transactional email service is needed for the current setup.

## Printing

Use **Print Receipt** on an individual trip, select rows and choose **Print Selected**, or choose **Print All**. The preview arranges six compact receipts on each A4 sheet in three rows and two columns, reserving blank slots on the final sheet when needed. The print stylesheet hides application navigation and controls. Use the browser's **Save as PDF** destination to create a PDF copy.
