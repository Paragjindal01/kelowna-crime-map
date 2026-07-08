import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify, XP_VALUES } from "@/lib/community";
import { deleteImages } from "@/lib/blob";
import { isAdmin, logAudit } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.lostItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.moderation !== undefined) {
      if (!["approved", "rejected", "pending"].includes(body.moderation)) {
        return NextResponse.json({ error: "Invalid moderation status" }, { status: 400 });
      }
      data.moderation = body.moderation;
      // On rejection, purge images from Blob and clear stored URLs.
      if (body.moderation === "rejected") {
        await deleteImages([existing.imageUrl, ...existing.imageUrls]);
        data.imageUrl = null;
        data.imageUrls = [];
      }
    }
    if (body.status !== undefined) {
      if (!["lost", "found", "returned"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 80);
    if (typeof body.category === "string" && body.category.trim()) data.category = body.category.trim().slice(0, 40);
    if (typeof body.description === "string") data.description = body.description.slice(0, 1000) || null;
    if (typeof body.location === "string" && body.location.trim()) data.location = body.location.trim().slice(0, 120);

    // Remove a single image by URL (from Blob + the stored arrays).
    if (typeof body.removeImage === "string") {
      const url = body.removeImage;
      await deleteImages([url]);
      const remaining = existing.imageUrls.filter((u) => u !== url);
      data.imageUrls = remaining;
      if (existing.imageUrl === url) data.imageUrl = remaining[0] ?? null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const item = await prisma.lostItem.update({ where: { id }, data });

    if (data.moderation && existing.ownerId && existing.moderation !== data.moderation) {
      if (data.moderation === "approved") {
        await awardXp(existing.ownerId, XP_VALUES.item_approved, "Lost item listing approved");
        await notify(
          existing.ownerId,
          `Your listing "${existing.title}" is now live — +${XP_VALUES.item_approved} XP`,
          "/lost-found"
        );
      } else if (data.moderation === "rejected") {
        await notify(existing.ownerId, `Your listing "${existing.title}" was not approved`, "/dashboard");
      }
    }

    let action = "item_edited";
    if (data.moderation) action = `item_${data.moderation}`;
    else if (data.status === "returned") action = "item_returned";
    else if (body.removeImage) action = "item_image_removed";
    await logAudit(request, action, "lostItem", id);

    return NextResponse.json(item);
  } catch (error) {
    console.error("Error updating lost item:", error);
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
    await logAudit(request, "item_deleted", "lostItem", id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting lost item:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
