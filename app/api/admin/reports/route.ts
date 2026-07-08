import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, logAudit } from "@/lib/admin";

const CRIME_TYPES = [
  "vehicle_theft", "theft_from_vehicle", "residential_break_enter",
  "commercial_break_enter", "shoplifting", "package_theft", "bicycle_theft",
  "vandalism_mischief", "trespassing", "suspicious_activity", "assault",
  "harassment_threats",
];

// Admin list: filter by status (?status=pending|approved|rejected|all).
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = new URL(request.url).searchParams.get("status") || "pending";
    const where = status === "all" ? {} : { status: status as any };

    const reports = await prisma.report.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

// Admin manual creation — published (approved) immediately.
export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await getSessionUser();
    const body = await request.json();

    const type = String(body.type ?? "");
    if (!CRIME_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid incident type" }, { status: 400 });
    }
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Valid coordinates required" }, { status: 400 });
    }
    const occurredAt = body.occurredAt ? new Date(body.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        type: type as any,
        occurredAt,
        address: typeof body.address === "string" ? body.address.slice(0, 200) || null : null,
        description: typeof body.description === "string" ? body.description.slice(0, 2000) || null : null,
        lat,
        lng,
        status: "approved",
        isVerified: !!body.isVerified,
        locationApproximate: body.locationApproximate !== false,
        sourceName: typeof body.sourceName === "string" ? body.sourceName.slice(0, 120) || null : null,
        sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl.slice(0, 300) || null : null,
        userId: admin?.id ?? null,
      },
    });

    await logAudit(request, "report_created", "report", report.id);
    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating admin report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
