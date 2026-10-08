"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth-session";
import {
  createTrip,
  deleteAllTrips,
  deleteTrip,
  deleteTrips,
  updateTrip,
} from "@/lib/trip-repository";
import { validateTripForm, type TripField } from "@/lib/trip-validation";

export interface TripFormState {
  fieldErrors: Partial<Record<TripField, string>>;
  formError?: string;
}

export async function createTripAction(
  _previousState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const user = await requireUser();
  const result = validateTripForm(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  let trip;
  try {
    trip = await createTrip(user.id, result.data);
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
  const user = await requireUser();
  const result = validateTripForm(formData);
  if (!result.data) return { fieldErrors: result.fieldErrors };

  let trip;
  try {
    trip = await updateTrip(user.id, id, result.data);
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

export interface DeleteTripResult {
  success: boolean;
  deletedCount?: number;
  error?: string;
}

export async function deleteTripAction(id: string): Promise<DeleteTripResult> {
  const user = await requireUser();
  try {
    const deleted = await deleteTrip(user.id, id);
    if (!deleted) return { success: false, error: "This trip no longer exists." };
  } catch (error) {
    console.error("Unable to delete trip", error);
    return { success: false, error: "The trip could not be deleted. Please try again." };
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${id}`);
  return { success: true, deletedCount: 1 };
}

export async function deleteSelectedTripsAction(ids: string[]): Promise<DeleteTripResult> {
  const user = await requireUser();
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) {
    return { success: false, error: "Select at least one trip to delete." };
  }

  try {
    const deletedCount = await deleteTrips(user.id, uniqueIds);
    revalidatePath("/trips");
    return { success: true, deletedCount };
  } catch (error) {
    console.error("Unable to delete selected trips", error);
    return { success: false, error: "The selected trips could not be deleted. Please try again." };
  }
}

export async function deleteAllTripsAction(): Promise<DeleteTripResult> {
  const user = await requireUser();
  try {
    const deletedCount = await deleteAllTrips(user.id);
    revalidatePath("/trips");
    return { success: true, deletedCount };
  } catch (error) {
    console.error("Unable to delete all trips", error);
    return { success: false, error: "The trips could not be deleted. Please try again." };
  }
}
