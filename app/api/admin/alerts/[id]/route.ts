import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify } from "@/lib/community";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { moderation } = await request.json();

    if (moderation !== "approved" && moderation !== "rejected") {
      return NextResponse.json({ error: "Invalid moderation status" }, { status: 400 });
    }

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    const alert = await prisma.alert.update({
      where: { id },
      data: { moderation },
    });

    if (existing.userId && existing.moderation !== moderation) {
      if (moderation === "approved") {
        await awardXp(existing.userId, 10, "Community alert approved");
        await notify(
          existing.userId,
          `Your alert "${existing.title}" is now live — +10 XP`,
          "/alerts"
        );
      } else {
        await notify(existing.userId, `Your alert "${existing.title}" was not approved`, "/dashboard");
      }
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error moderating alert:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
