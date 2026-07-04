import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { computeAchievements, publicUser } from "@/lib/community";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.banned) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Sequential — avoid bursting Neon's pooled connection limit.
  const approvedReports = await prisma.report.count({ where: { userId: id, status: "approved" } });
  const itemsPosted = await prisma.lostItem.count({ where: { ownerId: id, moderation: "approved" } });
  const itemsReturnedToOthers = await prisma.xpEvent.count({ where: { userId: id, reason: { startsWith: "Returned" } } });
  const itemsRecovered = await prisma.lostItem.count({ where: { ownerId: id, status: "returned" } });

  return NextResponse.json({
    ...publicUser(user),
    stats: {
      approvedReports,
      itemsPosted,
      itemsReturnedToOthers,
      itemsRecovered,
    },
    achievements: computeAchievements({
      approvedReports,
      itemsReturned: itemsReturnedToOthers,
      xp: user.xp,
    }),
  });
}
