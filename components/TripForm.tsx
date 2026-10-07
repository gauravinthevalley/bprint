"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import type { TripFormState } from "@/app/trip-actions";
import { calculateDistanceFare, calculateNetFare, formatCurrency } from "@/lib/formatting";
import { PAYMENT_METHODS, type Trip } from "@/types/trip";

type FormAction = (state: TripFormState, formData: FormData) => Promise<TripFormState>;
type EditableFareField = "baseFare" | "timeCharge" | "permitCharge";

interface TripFormProps {
  action: FormAction;
  trip?: Trip;
  defaultDate?: string;
}

const chargeLabels: Array<[EditableFareField, string]> = [
  ["timeCharge", "Time Charge"],
  ["permitCharge", "Permit Charge"],
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-700">{message}</p>;
}

function FormSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <fieldset className="border-b border-slate-200 pb-8 last:border-0 last:pb-0">
      <legend className="mb-5 text-base font-semibold text-slate-950">{title}</legend>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function TextInput({
  name,
  label,
  defaultValue,
  error,
  required = false,
  type = "text",
  step,
  min,
  placeholder,
  fullWidth = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  error?: string;
  required?: boolean;
  type?: string;
  step?: string;
  min?: string;
  placeholder?: string;
  fullWidth?: boolean;
}) {
  return (
    <label className={fullWidth ? "sm:col-span-2" : undefined}>
      <span className="form-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </span>
      <input
        className={`form-input${error ? " form-input-error" : ""}`}
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        step={step}
        min={min}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      <span id={`${name}-error`}>
        <FieldError message={error} />
      </span>
    </label>
  );
}

export function TripForm({ action, trip, defaultDate }: TripFormProps) {
  const [state, formAction, pending] = useActionState(action, { fieldErrors: {} });
  const [distanceKm, setDistanceKm] = useState(String(trip?.distanceKm ?? ""));
  const [farePerKm, setFarePerKm] = useState(
    trip?.farePerKm == null ? "55.00" : String(trip.farePerKm),
  );
  const [fares, setFares] = useState<Record<EditableFareField, string>>({
    baseFare: trip ? String(trip.baseFare) : "80",
    timeCharge: String(trip?.timeCharge ?? 0),
    permitCharge: String(trip?.permitCharge ?? 0),
  });

  const distanceFare = useMemo(
    () =>
      calculateDistanceFare({
        baseFare: Number(fares.baseFare) || 0,
        distanceKm: Number(distanceKm) || 0,
        farePerKm: Number(farePerKm) || 0,
      }),
    [distanceKm, farePerKm, fares.baseFare],
  );
  const netFare = useMemo(
    () =>
      calculateNetFare({
        distanceFare,
        timeCharge: Number(fares.timeCharge) || 0,
        permitCharge: Number(fares.permitCharge) || 0,
      }),
    [distanceFare, fares.permitCharge, fares.timeCharge],
  );
  const cancelHref = trip ? `/trips/${trip.id}` : "/trips";

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.formError && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.formError}
        </div>
      )}

      <FormSection title="Trip Information">
        <input type="hidden" name="time" defaultValue={trip?.time ?? ""} />
        <TextInput
          name="date"
          label="Date"
          type="date"
          required
          defaultValue={trip?.date ?? defaultDate}
          error={state.fieldErrors.date}
        />
        <TextInput
          name="tripId"
          label="Trip ID"
          defaultValue={trip?.tripId}
          error={state.fieldErrors.tripId}
          placeholder="Generated automatically if blank"
          fullWidth
        />
      </FormSection>

      <FormSection title="Passenger">
        <TextInput
          name="passengerName"
          label="Passenger Name"
          defaultValue={trip?.passengerName}
          error={state.fieldErrors.passengerName}
          fullWidth
        />
      </FormSection>

      <FormSection title="Vehicle / Driver">
        <TextInput
          name="driverName"
          label="Driver Name"
          defaultValue={trip?.driverName}
          error={state.fieldErrors.driverName}
          required
        />
        <TextInput
          name="taxiNumber"
          label="Taxi / Vehicle Number"
          defaultValue={trip?.taxiNumber}
          error={state.fieldErrors.taxiNumber}
          required
        />
      </FormSection>

      <FormSection title="Journey">
        <TextInput
          name="pickupLocation"
          label="Pickup Location"
          defaultValue={trip?.pickupLocation}
          error={state.fieldErrors.pickupLocation}
          required
          fullWidth
        />
        <TextInput
          name="pickupTime"
          label="Pickup Time"
          type="time"
          defaultValue={trip?.pickupTime}
          error={state.fieldErrors.pickupTime}
        />
        <TextInput
          name="dropoffTime"
          label="Drop Off Time"
          type="time"
          defaultValue={trip?.dropoffTime}
          error={state.fieldErrors.dropoffTime}
        />
        <TextInput
          name="dropoffLocation"
          label="Drop Off Location"
          defaultValue={trip?.dropoffLocation}
          error={state.fieldErrors.dropoffLocation}
          required
          fullWidth
        />
        <label>
          <span className="form-label">Distance (km) <span aria-hidden="true">*</span></span>
          <input
            className={`form-input${state.fieldErrors.distanceKm ? " form-input-error" : ""}`}
            type="number"
            name="distanceKm"
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            aria-invalid={Boolean(state.fieldErrors.distanceKm)}
          />
          <FieldError message={state.fieldErrors.distanceKm} />
        </label>
        <label>
          <span className="form-label">Fare per KM (Rs.) <span aria-hidden="true">*</span></span>
          <input
            className={`form-input${state.fieldErrors.farePerKm ? " form-input-error" : ""}`}
            type="number"
            name="farePerKm"
            value={farePerKm}
            onChange={(event) => setFarePerKm(event.target.value)}
            min="0"
            step="0.01"
            inputMode="decimal"
            required
            aria-invalid={Boolean(state.fieldErrors.farePerKm)}
          />
          <FieldError message={state.fieldErrors.farePerKm} />
        </label>
      </FormSection>

      <FormSection title="Payment">
        <label>
          <span className="form-label">Payment Method</span>
          <select
            className={`form-input${state.fieldErrors.paymentMethod ? " form-input-error" : ""}`}
            name="paymentMethod"
            defaultValue={trip?.paymentMethod ?? "Cash"}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
          <FieldError message={state.fieldErrors.paymentMethod} />
        </label>
      </FormSection>

      <FormSection title="Fare">
        <label>
          <span className="form-label">Base Fare (Rs.)</span>
          <input
            className={`form-input${state.fieldErrors.baseFare ? " form-input-error" : ""}`}
            type="number"
            name="baseFare"
            value={fares.baseFare}
            onChange={(event) =>
              setFares((current) => ({ ...current, baseFare: event.target.value }))
            }
            min="0"
            step="0.01"
            inputMode="decimal"
            aria-invalid={Boolean(state.fieldErrors.baseFare)}
          />
          <FieldError message={state.fieldErrors.baseFare} />
        </label>
        <label>
          <span className="form-label">Distance Fare (Rs.)</span>
          <input
            className="form-input bg-slate-100 text-slate-700"
            type="text"
            value={distanceFare.toFixed(2)}
            readOnly
            aria-describedby="distance-fare-help"
          />
          <span id="distance-fare-help" className="mt-1.5 block text-xs text-slate-500">
            Base Fare + Distance × Fare per KM
          </span>
        </label>
        {chargeLabels.map(([name, label]) => (
          <label key={name}>
            <span className="form-label">{label} (Rs.)</span>
            <input
              className={`form-input${state.fieldErrors[name] ? " form-input-error" : ""}`}
              type="number"
              name={name}
              value={fares[name]}
              onChange={(event) =>
                setFares((current) => ({ ...current, [name]: event.target.value }))
              }
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-invalid={Boolean(state.fieldErrors[name])}
            />
            <FieldError message={state.fieldErrors[name]} />
          </label>
        ))}
        <div className="sm:col-span-2 rounded-lg border border-slate-300 bg-slate-50 px-5 py-4">
          <p className="text-sm font-medium text-slate-600">Calculated total</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">Net Fare: {formatCurrency(netFare)}</p>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving…" : trip ? "Save Changes" : "Save Trip"}
        </button>
      </div>
    </form>
  );
}
