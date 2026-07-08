import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify, XP_VALUES } from "@/lib/community";
import { isAdmin, logAudit } from "@/lib/admin";

const CRIME_TYPES = [
  "vehicle_theft", "theft_from_vehicle", "residential_break_enter",
  "commercial_break_enter", "shoplifting", "package_theft", "bicycle_theft",
  "vandalism_mischief", "trespassing", "suspicious_activity", "assault",
  "harassment_threats",
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

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Whitelist editable fields.
    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!["approved", "rejected", "pending"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (body.type !== undefined) {
      if (!CRIME_TYPES.includes(body.type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      data.type = body.type;
    }
    if (body.isVerified !== undefined) data.isVerified = !!body.isVerified;
    if (body.locationApproximate !== undefined) data.locationApproximate = !!body.locationApproximate;
    if (typeof body.address === "string") data.address = body.address.slice(0, 200) || null;
    if (typeof body.description === "string") data.description = body.description.slice(0, 2000) || null;
    if (body.occurredAt !== undefined) {
      const d = new Date(body.occurredAt);
      if (!Number.isNaN(d.getTime())) data.occurredAt = d;
    }
    if (body.lat !== undefined && Number.isFinite(Number(body.lat))) data.lat = Number(body.lat);
    if (body.lng !== undefined && Number.isFinite(Number(body.lng))) data.lng = Number(body.lng);

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const report = await prisma.report.update({ where: { id }, data });

    // Reputation + notification only on status transitions.
    if (data.status && existing.userId && existing.status !== data.status) {
      if (data.status === "approved") {
        await awardXp(existing.userId, XP_VALUES.report_approved, "Crime report approved");
        await notify(existing.userId, `Your report was approved — +${XP_VALUES.report_approved} XP`, "/dashboard");
      } else if (data.status === "rejected") {
        await notify(existing.userId, "Your report was reviewed but not published", "/dashboard");
      }
    }

    const action = data.status ? `report_${data.status}` : "report_edited";
    await logAudit(request, action, "report", id);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
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
    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    await prisma.report.delete({ where: { id } });
    await logAudit(request, "report_deleted", "report", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
