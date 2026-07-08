import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { publicUser } from "@/lib/community";
import { ALERT_CATEGORIES } from "@/lib/categories";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

const VALID_CATEGORIES = new Set(ALERT_CATEGORIES.map((c) => c.key as string));

// Public: approved alerts only.
export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      where: { moderation: "approved" },
      include: { user: true },
      orderBy: { startsAt: "desc" },
      take: 200,
    });

    return NextResponse.json(
      alerts.map(({ user, userId, ...a }) => ({
        ...a,
        reporter: user ? publicUser(user) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to post an alert" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before posting alerts — check your dashboard" },
        { status: 403 }
      );
    }
    if (!rateLimit(`alert:${user.id}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const body = await request.json();
    const category = String(body.category ?? "");
    const title = String(body.title ?? "").trim().slice(0, 100);
    const description = String(body.description ?? "").trim().slice(0, 1000);
    const location = String(body.location ?? "").trim().slice(0, 150);
    const severity = Number(body.severity);
    const lat = body.lat === null || body.lat === undefined || body.lat === "" ? null : Number(body.lat);
    const lng = body.lng === null || body.lng === undefined || body.lng === "" ? null : Number(body.lng);

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!title || !location) {
      return NextResponse.json({ error: "Title and location are required" }, { status: 400 });
    }
    if (![1, 2, 3].includes(severity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
    }
    if (lat !== null || lng !== null) {
      if (
        lat === null || lng === null ||
        !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < 48 || lat > 53 || lng < -125 || lng > -114
      ) {
        return NextResponse.json({ error: "Location must be within the Okanagan region" }, { status: 400 });
      }
    }

    // Duplicate guard
    const recentDuplicate = await prisma.alert.findFirst({
      where: {
        userId: user.id,
        title,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: "You just posted this alert — it's waiting for moderator review" },
        { status: 409 }
      );
    }

    const alert = await prisma.alert.create({
      data: {
        category: category as any,
        title,
        description: description || null,
        location,
        lat,
        lng,
        severity,
        userId: user.id,
        moderation: "pending",
        locationApproximate: true,
      },
    });

    return NextResponse.json(alert, { status: 201 });
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
