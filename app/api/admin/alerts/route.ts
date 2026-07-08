import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, logAudit } from "@/lib/admin";

const CATEGORIES = [
  "road_closure", "traffic", "fire", "flood", "power_outage", "fallen_tree",
  "emergency", "missing_pet", "community_warning", "public_notice", "construction", "other",
];

// Admin list: ?status=pending|approved|rejected|all
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = new URL(request.url).searchParams.get("status") || "pending";
    const where = status === "all" ? {} : { moderation: status as any };

    const alerts = await prisma.alert.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: "Failed to fetch alerts" }, { status: 500 });
  }
}

// Admin manual creation — published (approved + active) immediately.
export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await getSessionUser();
    const body = await request.json();

    const category = String(body.category ?? "");
    if (!CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    const title = String(body.title ?? "").trim().slice(0, 100);
    const location = String(body.location ?? "").trim().slice(0, 150);
    if (!title || !location) {
      return NextResponse.json({ error: "Title and location are required" }, { status: 400 });
    }
    const severity = [1, 2, 3].includes(Number(body.severity)) ? Number(body.severity) : 2;
    const lat = body.lat === undefined || body.lat === null || body.lat === "" ? null : Number(body.lat);
    const lng = body.lng === undefined || body.lng === null || body.lng === "" ? null : Number(body.lng);

    const alert = await prisma.alert.create({
      data: {
        category: category as any,
        title,
        description: typeof body.description === "string" ? body.description.slice(0, 1000) || null : null,
        location,
        lat: Number.isFinite(lat as number) ? (lat as number) : null,
        lng: Number.isFinite(lng as number) ? (lng as number) : null,
        severity,
        status: "active",
        moderation: "approved",
        isVerified: !!body.isVerified,
        locationApproximate: body.locationApproximate !== false,
        sourceName: typeof body.sourceName === "string" ? body.sourceName.slice(0, 120) || null : null,
        sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl.slice(0, 300) || null : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
        userId: admin?.id ?? null,
      },
    });

    await logAudit(request, "alert_created", "alert", alert.id);
    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating admin alert:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
