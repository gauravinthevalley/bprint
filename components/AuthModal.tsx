"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

function safeDestination(next: string | undefined): string {
  return next?.startsWith("/trips") && !next.startsWith("//") ? next : "/trips";
}

export function AuthModal({ next }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const destination = safeDestination(next);

    if (mode === "sign-up" && password !== String(form.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({
              email,
              password,
              name: String(form.get("name") ?? "").trim(),
            });

      if (result.error) {
        setError(result.error.message || "Authentication failed. Please try again.");
        return;
      }

      router.replace(destination);
      router.refresh();
    } catch {
      setError("Authentication failed. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Travel Receipts</p>
        <h1 id="auth-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "sign-in"
            ? "Sign in to view and manage your trip receipts."
            : "Create your account to keep your receipts separate and private."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "sign-up" && (
            <label className="block text-sm font-semibold text-slate-700">
              Name
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          )}
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              autoFocus
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input
              name="password"
              type="password"
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={12}
              required
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
            />
            {mode === "sign-up" && (
              <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 12 characters.</span>
            )}
          </label>
          {mode === "sign-up" && (
            <label className="block text-sm font-semibold text-slate-700">
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
                className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2.5 font-normal text-slate-950 outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          )}

          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          {mode === "sign-in" ? "Need an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => changeMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="font-semibold text-slate-900 underline-offset-2 hover:underline"
          >
            {mode === "sign-in" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </section>
    </div>
  );
}
