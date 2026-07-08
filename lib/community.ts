import prisma from "./prisma";

export const XP_VALUES = {
  report_approved: 10,
  report_verified: 25,
  item_approved: 10,
  item_found_for_someone: 50,
  item_returned: 100,
} as const;

export const LEVELS = [
  { level: 1, name: "New Member", minXp: 0 },
  { level: 2, name: "Community Helper", minXp: 100 },
  { level: 3, name: "Trusted Reporter", minXp: 300 },
  { level: 4, name: "Public Safety Contributor", minXp: 700 },
  { level: 5, name: "Community Guardian", minXp: 1500 },
];

export function levelForXp(xp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  const next = LEVELS.find((l) => l.minXp > xp) ?? null;
  return {
    ...current,
    nextLevel: next,
    progress: next
      ? Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100)
      : 100,
  };
}

export async function awardXp(userId: string, amount: number, reason: string) {
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { xp: { increment: amount } } }),
    prisma.xpEvent.create({ data: { userId, amount, reason } }),
  ]);
}

export async function notify(userId: string, body: string, link?: string) {
  await prisma.notification.create({ data: { userId, body, link } });
}

const ACHIEVEMENT_DEFS = [
  { key: "first_report", label: "First Report", icon: "📋" },
  { key: "ten_approved", label: "10 Approved Reports", icon: "🏅" },
  { key: "item_returned", label: "Lost Item Returned", icon: "🎁" },
  { key: "community_hero", label: "Community Hero", icon: "🦸" },
  { key: "trusted_member", label: "Trusted Member", icon: "🤝" },
  { key: "thousand_xp", label: "1000 Reputation Points", icon: "💎" },
];

export function computeAchievements(stats: {
  approvedReports: number;
  itemsReturned: number;
  xp: number;
}) {
  const earned = new Set<string>();
  if (stats.approvedReports >= 1) earned.add("first_report");
  if (stats.approvedReports >= 10) earned.add("ten_approved");
  if (stats.itemsReturned >= 1) earned.add("item_returned");
  if (stats.itemsReturned >= 5) earned.add("community_hero");
  if (stats.xp >= LEVELS[2].minXp) earned.add("trusted_member");
  if (stats.xp >= 1000) earned.add("thousand_xp");
  return ACHIEVEMENT_DEFS.map((a) => ({ ...a, earned: earned.has(a.key) }));
}

export function publicUser(user: {
  id: string;
  name: string;
  avatarColor: string;
  xp: number;
  createdAt: Date;
  emailVerified?: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    avatarColor: user.avatarColor,
    xp: user.xp,
    verified: user.emailVerified ?? false,
    level: levelForXp(user.xp),
    joinedAt: user.createdAt,
  };
}
