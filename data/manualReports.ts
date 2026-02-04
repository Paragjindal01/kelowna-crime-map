export type Report = {
  id: string;
  type: string;
  status: "approved";
  occurredAt: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
};

const CRIME_TYPES = [
  "vehicle_theft",
  "bicycle_theft",
  "break_enter",
  "assault",
  "mischief",
];

// Kelowna bounds (rough but realistic)
const LAT_MIN = 49.82;
const LAT_MAX = 49.95;
const LNG_MIN = -119.62;
const LNG_MAX = -119.35;

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomDateWithin(days: number) {
  const now = Date.now();
  const past = now - days * 24 * 60 * 60 * 1000;
  return new Date(randomBetween(past, now)).toISOString();
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const manualReports: Report[] = Array.from({ length: 120 }).map(
  (_, i) => ({
    id: `manual-${i + 1}`,
    type: randomItem(CRIME_TYPES),
    status: "approved",
    occurredAt: randomDateWithin(120),
    lat: randomBetween(LAT_MIN, LAT_MAX),
    lng: randomBetween(LNG_MIN, LNG_MAX),
    address: "Kelowna, BC",
    description: "Reported incident (sample data)",
  })
);
