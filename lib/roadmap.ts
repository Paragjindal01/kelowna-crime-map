// Planned features the community can vote on. Keys are stored in FeatureVote
// rows, so don't rename them once live.
export const PLANNED_FEATURES = [
  {
    key: "missing_pets",
    icon: "🐕",
    title: "Missing Pets",
    description: "Dedicated pet alerts with photos, last-seen locations, and reunion tracking.",
  },
  {
    key: "stolen_vehicles",
    icon: "🚗",
    title: "Stolen Vehicle Registry",
    description: "Searchable plates and descriptions so the community can keep an eye out.",
  },
  {
    key: "neighborhood_watch",
    icon: "🏘️",
    title: "Neighbourhood Watch Groups",
    description: "Join your neighbourhood's group for local updates and coordination.",
  },
  {
    key: "safety_resources",
    icon: "📚",
    title: "Safety Resources",
    description: "Emergency contacts, shelter locations, and local safety tips in one place.",
  },
  {
    key: "mobile_app",
    icon: "📱",
    title: "Mobile App",
    description: "Native iOS/Android app with push notifications for nearby incidents.",
  },
] as const;

export const LIVE_FEATURES = [
  { icon: "🗺️", title: "Live Safety Map", description: "Verified incident reports across Kelowna" },
  { icon: "📢", title: "Community Alerts", description: "Road closures, hazards, outages & notices — shipped July 2026" },
  { icon: "🧺", title: "Lost & Found", description: "Post, find, and return lost items" },
  { icon: "💬", title: "Private Messaging", description: "Contact owners without sharing emails" },
  { icon: "🏆", title: "Community Reputation", description: "XP, levels, achievements & leaderboard" },
  { icon: "✅", title: "Moderated Content", description: "Every submission reviewed before going live" },
  { icon: "✉️", title: "Verified Accounts", description: "Email verification for trusted members" },
];
