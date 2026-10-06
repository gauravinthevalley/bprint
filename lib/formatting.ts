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

export function calculateNetFare(
  fares: Pick<
    { baseFare: number; distanceFare: number; timeCharge: number; permitCharge: number },
    "baseFare" | "distanceFare" | "timeCharge" | "permitCharge"
  >,
): number {
  return fares.baseFare + fares.distanceFare + fares.timeCharge + fares.permitCharge;
}
