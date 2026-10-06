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
npm start
```

## Data storage

Trips are stored in `data/trips.json` by the local JSON implementation in `lib/trip-repository.ts`. The file is initialized with an empty array if it does not exist. Writes in one Node.js process are serialized and use a temporary file plus rename to reduce the chance of a partial write.

For isolated development or test runs, set `TRIPS_DATA_FILE` to an alternate JSON file path before starting the server.

> **Important:** JSON persistence is for local development only. Vercel functions do not provide a durable, shared writable filesystem. Records written this way can disappear between deployments or function invocations and are not safe across multiple server instances.

The pages, forms, receipt, and server actions do not access the JSON file directly. They use the `TripRepository` operations (`getTrips`, `getTrip`, `createTrip`, and `updateTrip`). To add persistent production storage, implement the same interface with Postgres, Neon, Supabase, or another durable service, then replace the exported repository instance. No form or receipt component needs to change.

## Deploying to Vercel

1. Push the project to a Git provider.
2. Import the repository in Vercel as a Next.js project.
3. Confirm the build command is `npm run build`.
4. Before using the deployment for real records, configure a durable database and switch the repository implementation.
5. Add database credentials as Vercel environment variables and run any provider-specific migrations.

The application can be previewed on Vercel with the JSON repository, but saved data must be considered temporary until a durable repository is configured.

## Printing

Open a saved trip and select **Print Receipt**. The print stylesheet hides application navigation and controls and formats only the receipt for A4 output. Use the browser's **Save as PDF** destination to create a PDF copy.
