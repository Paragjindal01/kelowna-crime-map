import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify, XP_VALUES } from "@/lib/community";
import { deleteImages } from "@/lib/blob";

function isAdmin(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  return !!process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
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

    // On rejection, purge the images from Blob and clear the stored URLs.
    const rejecting = moderation === "rejected";
    if (rejecting) {
      await deleteImages([existing.imageUrl, ...existing.imageUrls]);
    }

    const item = await prisma.lostItem.update({
      where: { id },
      data: rejecting
        ? { moderation, imageUrl: null, imageUrls: [] }
        : { moderation },
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

// Fully delete a listing and its images. Message threads cascade automatically.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.lostItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await deleteImages([existing.imageUrl, ...existing.imageUrls]);
    await prisma.lostItem.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting lost item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
