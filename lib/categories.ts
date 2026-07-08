// Shared category definitions for Community Alerts. Client-safe (no prisma).
// Keys match the AlertCategory enum in prisma/schema.prisma.

// Civic category palette — muted, professional, distinguishable.
export const ALERT_CATEGORIES = [
  { key: "road_closure", label: "Road Closure", emoji: "🚧", color: "#c2410c" },
  { key: "traffic", label: "Traffic Incident", emoji: "🚗", color: "#b45309" },
  { key: "fire", label: "Fire", emoji: "🔥", color: "#b42318" },
  { key: "flood", label: "Flood", emoji: "🌊", color: "#1d6e8c" },
  { key: "power_outage", label: "Power Outage", emoji: "⚡", color: "#8a6f3d" },
  { key: "fallen_tree", label: "Fallen Tree", emoji: "🌳", color: "#2f5d50" },
  { key: "emergency", label: "Emergency", emoji: "🚨", color: "#991b1b" },
  { key: "missing_pet", label: "Missing Pet", emoji: "🐕", color: "#8a6f3d" },
  { key: "community_warning", label: "Community Warning", emoji: "⚠️", color: "#0f766e" },
  { key: "public_notice", label: "Public Notice", emoji: "📢", color: "#475467" },
  { key: "construction", label: "Construction", emoji: "🏗️", color: "#b45309" },
  { key: "other", label: "Other", emoji: "📌", color: "#667085" },
] as const;

export type AlertCategoryKey = (typeof ALERT_CATEGORIES)[number]["key"];

const byKey = new Map(ALERT_CATEGORIES.map((c) => [c.key as string, c]));

export function alertCategory(key: string) {
  return byKey.get(key) ?? ALERT_CATEGORIES[ALERT_CATEGORIES.length - 1];
}

export const SEVERITY = [
  { value: 1, label: "Info", color: "#475467" },
  { value: 2, label: "Caution", color: "#b45309" },
  { value: 3, label: "Danger", color: "#b42318" },
] as const;

export function severityInfo(value: number) {
  return SEVERITY.find((s) => s.value === value) ?? SEVERITY[1];
}
