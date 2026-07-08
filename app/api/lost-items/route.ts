import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { publicUser } from "@/lib/community";
import { rateLimit, rateLimited } from "@/lib/ratelimit";
import { storeImage, ALLOWED_IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES } from "@/lib/blob";

// Public listing: approved items only, contact info never exposed.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";

    if (mine) {
      const user = await getSessionUser();
      if (!user) return NextResponse.json([], { status: 200 });
      const items = await prisma.lostItem.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(items.map(({ contact, ...rest }) => rest));
    }

    const items = await prisma.lostItem.findMany({
      where: { moderation: "approved" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { owner: true },
    });

    return NextResponse.json(
      items.map(({ contact, owner, ...rest }) => ({
        ...rest,
        owner: owner ? publicUser(owner) : null,
      }))
    );
  } catch (error) {
    console.error("Error fetching lost items:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to post a lost item" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before posting — check your inbox or resend from your dashboard" },
        { status: 403 }
      );
    }

    if (!rateLimit(`lostitem:${user.id}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const form = await request.formData();

    const title = String(form.get("title") ?? "").trim().slice(0, 80);
    const category = String(form.get("category") ?? "").trim().slice(0, 40);
    const description = String(form.get("description") ?? "").trim().slice(0, 1000);
    const location = String(form.get("location") ?? "").trim().slice(0, 120);
    const dateLost = String(form.get("dateLost") ?? "").trim();

    if (!title || !category || !location || !dateLost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Accept up to MAX_IMAGES files under "photos" (multi) or legacy "photo" (single).
    const files = [...form.getAll("photos"), form.get("photo")].filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload at most ${MAX_IMAGES} images` },
        { status: 400 }
      );
    }
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES[file.type]) {
        return NextResponse.json(
          { error: "Photos must be JPEG, PNG, or WebP" },
          { status: 400 }
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: "Each photo must be under 3MB" }, { status: 400 });
      }
    }

    // Duplicate guard: same user, same title in the last 10 minutes
    const recentDuplicate = await prisma.lostItem.findFirst({
      where: {
        ownerId: user.id,
        title,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });
    if (recentDuplicate) {
      return NextResponse.json(
        { error: "You just posted this item — it's waiting for moderator review" },
        { status: 409 }
      );
    }

    // Upload each image to Vercel Blob (or local dev fallback); store only URLs.
    const imageUrls: string[] = [];
    for (const file of files) {
      imageUrls.push(await storeImage(file));
    }

    const item = await prisma.lostItem.create({
      data: {
        title,
        category,
        description: description || null,
        location,
        dateLost: new Date(dateLost),
        contact: user.email,
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        ownerId: user.id,
        moderation: "pending",
      },
    });

    const { contact, ...safe } = item;
    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    console.error("Error creating lost item:", error);
    return NextResponse.json({ error: "Failed to create lost item" }, { status: 500 });
  }
}
