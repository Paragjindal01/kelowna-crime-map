import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Sequential (not Promise.all) — Neon's pooled connection limit can
    // reject a burst of ~8 simultaneous queries from a single request.
    const members = await prisma.user.count();
    const reportsTotal = await prisma.report.count();
    const reportsApproved = await prisma.report.count({ where: { status: "approved" } });
    const reportsPending = await prisma.report.count({ where: { status: "pending" } });
    const itemsTotal = await prisma.lostItem.count();
    const itemsPending = await prisma.lostItem.count({ where: { moderation: "pending" } });
    const itemsReturned = await prisma.lostItem.count({ where: { status: "returned" } });
    const activeUserGroups = await prisma.xpEvent.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return NextResponse.json({
      members,
      reportsTotal,
      reportsApproved,
      reportsPending,
      itemsTotal,
      itemsPending,
      itemsReturned,
      activeThisMonth: activeUserGroups.length,
      successRate: itemsTotal > 0 ? Math.round((itemsReturned / itemsTotal) * 100) : 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
