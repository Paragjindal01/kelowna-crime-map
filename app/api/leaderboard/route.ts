import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publicUser } from "@/lib/community";

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Sequential (not Promise.all) — Neon's pooled connection limit can
    // reject a burst of many simultaneous queries from a single request.
    const topXp = await prisma.user.findMany({
      where: { banned: false },
      orderBy: { xp: "desc" },
      take: 10,
    });
    const returnEvents = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { reason: { startsWith: "Returned" } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });
    const approvedReports = await prisma.report.groupBy({
      by: ["userId"],
      where: { status: "approved", userId: { not: null } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });
    const recentEvents = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
      take: 5,
    });
    const totalMembers = await prisma.user.count({ where: { banned: false } });
    const totalApprovedReports = await prisma.report.count({ where: { status: "approved" } });
    const totalItemsReturned = await prisma.lostItem.count({ where: { status: "returned" } });
    const totals = [totalMembers, totalApprovedReports, totalItemsReturned];

    const userIds = new Set<string>();
    for (const g of [...returnEvents, ...approvedReports, ...recentEvents]) {
      if (g.userId) userIds.add(g.userId);
    }
    const users = await prisma.user.findMany({ where: { id: { in: Array.from(userIds) } } });
    const byId = new Map(users.map((u) => [u.id, publicUser(u)]));

    const decorate = (groups: { userId: string | null; _count: { userId: number } }[]) =>
      groups
        .filter((g) => g.userId && byId.has(g.userId))
        .map((g) => ({ user: byId.get(g.userId!), count: g._count.userId }));

    return NextResponse.json({
      topHelpers: topXp.map(publicUser),
      mostReturned: decorate(returnEvents),
      mostVerifiedReports: decorate(approvedReports),
      mostActive: decorate(recentEvents),
      totals: {
        members: totals[0],
        approvedReports: totals[1],
        itemsReturned: totals[2],
      },
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
