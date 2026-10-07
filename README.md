# Travel Receipts

A small Next.js application for creating, saving, viewing, editing, and printing taxi or travel receipts. It uses the App Router, TypeScript, Tailwind CSS, server actions, and React Server Components where interaction is not required.

## Install and run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page redirects to `/trips`.

Other commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run db:migrate
npm start
```

## Data storage

Trips are stored in `data/trips.json` by the local JSON implementation in `lib/trip-repository.ts`. The file is initialized with an empty array if it does not exist. Writes in one Node.js process are serialized and use a temporary file plus rename to reduce the chance of a partial write.

For isolated development or test runs, set `TRIPS_DATA_FILE` to an alternate JSON file path before starting the server.

> **Important:** JSON persistence is for local development only. Vercel functions do not provide a durable, shared writable filesystem. Records written this way can disappear between deployments or function invocations and are not safe across multiple server instances.

The pages, forms, receipt, and server actions do not access the JSON file directly. They use the `TripRepository` operations (`getTrips`, `getTrip`, `createTrip`, and `updateTrip`). When `DATABASE_URL` exists, the application selects the Neon implementation automatically. Local development continues to use JSON when that variable is absent.

On Vercel, `DATABASE_URL` is required. The application fails with a clear configuration error rather than attempting to write to Vercel's read-only application filesystem.

## Deploying to Vercel

1. Open the Vercel project and select **Storage → Create Database → Neon**.
2. Create a Vercel-managed Neon database and connect it to the `bprint` project.
3. Enable **Production** and **Preview**, mark the integration as required, and enable a Neon branch for Preview deployments.
4. Confirm that the integration provides `DATABASE_URL` to both environments. Never commit its value.
5. Redeploy the project. `vercel.json` runs `npm run db:migrate` before the Next.js build, creating the table on the environment's Neon branch.

The migration in `database/001_create_trips.sql` is idempotent, so it can run for every deployment. Preview branches are isolated from production and inherit the production schema at branch creation.

To use Neon locally, copy `.env.example` to `.env.local`, add a Neon connection string, and run:

```bash
npm run db:migrate
npm run dev
```

Without `DATABASE_URL`, local development uses `data/trips.json`; deployed Vercel environments never fall back to JSON.

## Printing

Use **Print Receipt** on an individual trip, select rows and choose **Print Selected**, or choose **Print All**. The preview arranges six compact receipts on each A4 sheet in three rows and two columns, reserving blank slots on the final sheet when needed. The print stylesheet hides application navigation and controls. Use the browser's **Save as PDF** destination to create a PDF copy.
