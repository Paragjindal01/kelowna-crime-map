import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { publicUser } from "@/lib/community";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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
    const photo = form.get("photo");

    if (!title || !category || !location || !dateLost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    let imageUrl: string | null = null;

    if (photo instanceof File && photo.size > 0) {
      const ext = ALLOWED_TYPES[photo.type];
      if (!ext) {
        return NextResponse.json(
          { error: "Photo must be a JPEG, PNG, or WebP image" },
          { status: 400 }
        );
      }
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "Photo must be under 5MB" }, { status: 400 });
      }

      const filename = `${crypto.randomBytes(12).toString("hex")}${ext}`;
      const buffer = Buffer.from(await photo.arrayBuffer());
      await writeFile(path.join(process.cwd(), "public", "uploads", filename), buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const item = await prisma.lostItem.create({
      data: {
        title,
        category,
        description: description || null,
        location,
        dateLost: new Date(dateLost),
        contact: user.email,
        imageUrl,
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
