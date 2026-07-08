import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Sequential (not Promise.all) — Neon's pooled connection limit can
    // reject a burst of many simultaneous queries from a single request.
    const members = await prisma.user.count();
    const reportsTotal = await prisma.report.count();
    const reportsApproved = await prisma.report.count({ where: { status: "approved" } });
    const reportsPending = await prisma.report.count({ where: { status: "pending" } });
    const reportsRejected = await prisma.report.count({ where: { status: "rejected" } });
    const itemsTotal = await prisma.lostItem.count();
    const itemsPending = await prisma.lostItem.count({ where: { moderation: "pending" } });
    const itemsRejected = await prisma.lostItem.count({ where: { moderation: "rejected" } });
    const itemsReturned = await prisma.lostItem.count({ where: { status: "returned" } });
    const alertsPending = await prisma.alert.count({ where: { moderation: "pending" } });
    const alertsActive = await prisma.alert.count({
      where: { moderation: "approved", status: "active" },
    });
    const alertsRejected = await prisma.alert.count({ where: { moderation: "rejected" } });
    const activeUserGroups = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const pendingTotal = reportsPending + itemsPending + alertsPending;
    const rejectedTotal = reportsRejected + itemsRejected + alertsRejected;

    return NextResponse.json({
      members,
      reportsTotal,
      reportsApproved,
      reportsPending,
      reportsRejected,
      itemsTotal,
      itemsPending,
      itemsRejected,
      itemsReturned,
      alertsPending,
      alertsActive,
      alertsRejected,
      pendingTotal,
      rejectedTotal,
      activeThisMonth: activeUserGroups.length,
      successRate: itemsTotal > 0 ? Math.round((itemsReturned / itemsTotal) * 100) : 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
