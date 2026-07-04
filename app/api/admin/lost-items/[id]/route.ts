import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify, XP_VALUES } from "@/lib/community";

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

    const existing = await prisma.lostItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = await prisma.lostItem.update({
      where: { id },
      data: { moderation },
    });

    if (existing.ownerId && existing.moderation !== moderation) {
      if (moderation === "approved") {
        await awardXp(existing.ownerId, XP_VALUES.item_approved, "Lost item listing approved");
        await notify(
          existing.ownerId,
          `Your listing "${existing.title}" is now live — +${XP_VALUES.item_approved} XP`,
          "/lost-found"
        );
      } else {
        await notify(existing.ownerId, `Your listing "${existing.title}" was not approved`, "/dashboard");
      }
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error moderating lost item:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
