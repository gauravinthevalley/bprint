import type { Trip } from "@/types/trip";

export const PRINT_SLOTS_PER_SHEET = 6;

export function selectTripsForPrint(
  trips: Trip[],
  options: { printAll: boolean; ids: string[] },
): Trip[] {
  if (options.printAll) return trips;
  const selectedIds = new Set(options.ids.filter(Boolean));
  return trips.filter((trip) => selectedIds.has(trip.id));
}

export function createPrintSheets<T>(items: T[]): Array<Array<T | null>> {
  const sheets: Array<Array<T | null>> = [];

  for (let index = 0; index < items.length; index += PRINT_SLOTS_PER_SHEET) {
    const sheet: Array<T | null> = items.slice(index, index + PRINT_SLOTS_PER_SHEET);
    while (sheet.length < PRINT_SLOTS_PER_SHEET) sheet.push(null);
    sheets.push(sheet);
  }

  return sheets;
}
