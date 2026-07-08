// Shared category definitions for Community Alerts. Client-safe (no prisma).
// Keys match the AlertCategory enum in prisma/schema.prisma.

export const ALERT_CATEGORIES = [
  { key: "road_closure", label: "Road Closure", emoji: "🚧", color: "#e39b2d" },
  { key: "traffic", label: "Traffic Incident", emoji: "🚗", color: "#c96f4a" },
  { key: "fire", label: "Fire", emoji: "🔥", color: "#e05038" },
  { key: "flood", label: "Flood", emoji: "🌊", color: "#5b9e9c" },
  { key: "power_outage", label: "Power Outage", emoji: "⚡", color: "#e3c975" },
  { key: "fallen_tree", label: "Fallen Tree", emoji: "🌳", color: "#7fa35c" },
  { key: "emergency", label: "Emergency", emoji: "🚨", color: "#c9302c" },
  { key: "missing_pet", label: "Missing Pet", emoji: "🐕", color: "#b3823f" },
  { key: "community_warning", label: "Community Warning", emoji: "⚠️", color: "#d9a45b" },
  { key: "public_notice", label: "Public Notice", emoji: "📢", color: "#8a5c8f" },
  { key: "construction", label: "Construction", emoji: "🏗️", color: "#a67c52" },
  { key: "other", label: "Other", emoji: "📌", color: "#c98ba6" },
] as const;

export type AlertCategoryKey = (typeof ALERT_CATEGORIES)[number]["key"];

const byKey = new Map(ALERT_CATEGORIES.map((c) => [c.key as string, c]));

export function alertCategory(key: string) {
  return byKey.get(key) ?? ALERT_CATEGORIES[ALERT_CATEGORIES.length - 1];
}

export const SEVERITY = [
  { value: 1, label: "Info", color: "#8a5c8f" },
  { value: 2, label: "Caution", color: "#d9a45b" },
  { value: 3, label: "Danger", color: "#c9302c" },
] as const;

export function severityInfo(value: number) {
  return SEVERITY.find((s) => s.value === value) ?? SEVERITY[1];
}
