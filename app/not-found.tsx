import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">404</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">Trip not found</h1>
      <p className="mt-3 text-slate-600">The receipt may have been removed or the link may be incorrect.</p>
      <Link href="/trips" className="mt-7 inline-flex rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
        Back to Trips
      </Link>
    </div>
  );
}
