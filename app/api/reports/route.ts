import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { rateLimit, clientIp, rateLimited } from "@/lib/ratelimit";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("mine") === "1") {
      const user = await getSessionUser();
      if (!user) return NextResponse.json([]);
      const mine = await prisma.report.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(mine);
    }

    // Public feed: approved reports only, public fields only. No account
    // attribution (userId) and no internal fields are ever exposed here.
    const reports = await prisma.report.findMany({
      where: { status: "approved" },
      orderBy: { occurredAt: "desc" },
      take: 500,
      select: {
        id: true,
        type: true,
        status: true,
        occurredAt: true,
        lat: true,
        lng: true,
        address: true,
        description: true,
        isVerified: true,
        sourceName: true,
        sourceUrl: true,
        locationApproximate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json([], { status: 200 });
  }
}

const VALID_TYPES = [
  "vehicle_theft", "theft_from_vehicle", "residential_break_enter",
  "commercial_break_enter", "shoplifting", "package_theft", "bicycle_theft",
  "vandalism_mischief", "trespassing", "suspicious_activity", "assault",
  "harassment_threats",
];

export async function POST(request: Request) {
  try {
    if (!rateLimit(`report:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const body = await request.json();
    const { type, occurredAt, address, description, lat, lng } = body;

    // Honeypot: real users never fill this hidden field. Pretend success so
    // bots don't learn they were caught.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    if (!type || !occurredAt || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid incident type" }, { status: 400 });
    }

    const latNum = Number(lat);
    const lngNum = Number(lng);
    // Rough bounds for the Okanagan / southern BC
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || latNum < 48 || latNum > 53 || lngNum < -125 || lngNum > -114) {
      return NextResponse.json({ error: "Location must be within the Okanagan region" }, { status: 400 });
    }

    const occurred = new Date(occurredAt);
    if (Number.isNaN(occurred.getTime()) || occurred.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "Invalid incident date" }, { status: 400 });
    }

    const cleanAddress = typeof address === "string" ? address.slice(0, 200) : null;
    const cleanDescription = typeof description === "string" ? description.slice(0, 2000) : null;

    const user = await getSessionUser();

    // Duplicate guard: identical type + location submitted in the last 10 minutes
    const recentDuplicate = await prisma.report.findFirst({
      where: {
        type,
        lat: latNum,
        lng: lngNum,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: "A matching report was just submitted — it may already be in the review queue" },
        { status: 409 }
      );
    }

    const report = await prisma.report.create({
      data: {
        type,
        occurredAt: occurred,
        address: cleanAddress,
        description: cleanDescription,
        lat: latNum,
        lng: lngNum,
        status: "pending",
        userId: user?.id ?? null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
