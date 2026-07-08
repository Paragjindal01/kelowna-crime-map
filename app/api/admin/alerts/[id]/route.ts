import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify } from "@/lib/community";
import { isAdmin, logAudit } from "@/lib/admin";

const CATEGORIES = [
  "road_closure", "traffic", "fire", "flood", "power_outage", "fallen_tree",
  "emergency", "missing_pet", "community_warning", "public_notice", "construction", "other",
];

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

    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (body.moderation !== undefined) {
      if (!["approved", "rejected", "pending"].includes(body.moderation)) {
        return NextResponse.json({ error: "Invalid moderation status" }, { status: 400 });
      }
      data.moderation = body.moderation;
    }
    if (body.status !== undefined) {
      if (!["active", "resolved"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      data.category = body.category;
    }
    if (body.severity !== undefined && [1, 2, 3].includes(Number(body.severity))) {
      data.severity = Number(body.severity);
    }
    if (body.isVerified !== undefined) data.isVerified = !!body.isVerified;
    if (body.locationApproximate !== undefined) data.locationApproximate = !!body.locationApproximate;
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim().slice(0, 100);
    if (typeof body.description === "string") data.description = body.description.slice(0, 1000) || null;
    if (typeof body.location === "string" && body.location.trim()) data.location = body.location.trim().slice(0, 150);
    if (body.lat !== undefined) data.lat = body.lat === null ? null : Number(body.lat);
    if (body.lng !== undefined) data.lng = body.lng === null ? null : Number(body.lng);
    if (body.startsAt !== undefined) {
      const d = new Date(body.startsAt);
      if (!Number.isNaN(d.getTime())) data.startsAt = d;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const alert = await prisma.alert.update({ where: { id }, data });

    if (data.moderation && existing.userId && existing.moderation !== data.moderation) {
      if (data.moderation === "approved") {
        await awardXp(existing.userId, 10, "Community alert approved");
        await notify(existing.userId, `Your alert "${existing.title}" is now live — +10 XP`, "/alerts");
      } else if (data.moderation === "rejected") {
        await notify(existing.userId, `Your alert "${existing.title}" was not approved`, "/dashboard");
      }
    }

    let action = "alert_edited";
    if (data.moderation) action = `alert_${data.moderation}`;
    else if (data.status) action = `alert_${data.status}`;
    await logAudit(request, action, "alert", id);

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.alert.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    await prisma.alert.delete({ where: { id } });
    await logAudit(request, "alert_deleted", "alert", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json({ error: "Failed to delete alert" }, { status: 500 });
  }
}
