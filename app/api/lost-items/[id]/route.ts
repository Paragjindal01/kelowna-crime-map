import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { awardXp, notify, XP_VALUES } from "@/lib/community";

// Owner updates the item status (found / returned / back to lost).
// Marking "returned" with a threadId credits the finder with XP.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status, threadId } = body;

    if (!["lost", "found", "returned"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const item = await prisma.lostItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    if (item.ownerId !== user.id) {
      return NextResponse.json({ error: "Only the owner can update this item" }, { status: 403 });
    }

    const updated = await prisma.lostItem.update({
      where: { id },
      data: { status },
    });

    // Credit the helper when the owner confirms the return.
    if (status === "returned" && item.status !== "returned" && threadId) {
      const thread = await prisma.messageThread.findUnique({ where: { id: threadId } });
      if (thread && thread.lostItemId === id && thread.ownerId === user.id) {
        await awardXp(thread.otherId, XP_VALUES.item_returned, `Returned "${item.title}" to its owner`);
        await notify(
          thread.otherId,
          `${user.name} confirmed you returned "${item.title}" — +${XP_VALUES.item_returned} XP! 🎉`,
          "/dashboard"
        );
      }
    }

    const { contact, ...safe } = updated;
    return NextResponse.json(safe);
  } catch (error) {
    console.error("Error updating lost item:", error);
    return NextResponse.json({ error: "Failed to update lost item" }, { status: 500 });
  }
}
