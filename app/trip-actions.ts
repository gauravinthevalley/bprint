"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTrip, updateTrip } from "@/lib/trip-repository";
import { validateTripForm, type TripField } from "@/lib/trip-validation";

export interface TripFormState {
  fieldErrors: Partial<Record<TripField, string>>;
  formError?: string;
}

export async function createTripAction(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const result = validateTripForm(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  let trip;
  try {
    trip = await createTrip(result.data);
  } catch (error) {
    console.error("Unable to create trip", error);
    return {
      fieldErrors: {},
      formError: "The trip could not be saved. Please try again.",
    };
  }

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}

export async function updateTripAction(
  id: string,
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const result = validateTripForm(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  let trip;
  try {
    trip = await updateTrip(id, result.data);
  } catch (error) {
    console.error("Unable to update trip", error);
    return {
      fieldErrors: {},
      formError: "The trip could not be updated. Please try again.",
    };
  }

  if (!trip) return { fieldErrors: {}, formError: "This trip no longer exists." };

  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  redirect(`/trips/${id}`);
}
