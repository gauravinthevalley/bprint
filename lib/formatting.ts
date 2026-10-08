export function formatCurrency(value: number): string {
  return `Rs. ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatReceiptDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatReceiptTime(value: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  if (!match) return value;

  const hour = Number(match[1]);
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
}

export function formatListDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDistance(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateDistanceFare({
  baseFare,
  distanceKm,
  farePerKm,
}: {
  baseFare: number;
  distanceKm: number;
  farePerKm: number;
}): number {
  return roundCurrency(baseFare + distanceKm * farePerKm);
}

export function calculateNetFare(
  fares: Pick<
    { distanceFare: number; timeCharge: number; permitCharge: number },
    "distanceFare" | "timeCharge" | "permitCharge"
  >,
): number {
  return roundCurrency(fares.distanceFare + fares.timeCharge + fares.permitCharge);
}

export function calculateReceiptNetFare({
  baseFare,
  netFare,
}: {
  baseFare: number;
  netFare: number;
}): number {
  return roundCurrency(baseFare + netFare);
}
