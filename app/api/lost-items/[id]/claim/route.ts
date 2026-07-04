import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notify } from "@/lib/community";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

// "I found this" / "This belongs to me" — opens a private message thread
// with the item owner. Contact details are never revealed.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in to contact the owner" }, { status: 401 });
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Verify your email before contacting owners — resend from your dashboard" },
        { status: 403 }
      );
    }

    if (!rateLimit(`claim:${user.id}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    const message = String(body.message ?? "").trim();

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Include a short message (max 2000 chars)" }, { status: 400 });
    }

    const item = await prisma.lostItem.findUnique({ where: { id } });
    if (!item || item.moderation !== "approved") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (!item.ownerId) {
      return NextResponse.json({ error: "This item has no registered owner" }, { status: 400 });
    }
    if (item.ownerId === user.id) {
      return NextResponse.json({ error: "This is your own item" }, { status: 400 });
    }

    const thread = await prisma.messageThread.upsert({
      where: { lostItemId_otherId: { lostItemId: id, otherId: user.id } },
      create: { lostItemId: id, ownerId: item.ownerId, otherId: user.id },
      update: {},
    });

    await prisma.message.create({
      data: { threadId: thread.id, senderId: user.id, body: message },
    });

    await notify(
      item.ownerId,
      `${user.name} messaged you about "${item.title}"`,
      "/dashboard"
    );

    return NextResponse.json({ threadId: thread.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json({ error: "Failed to contact owner" }, { status: 500 });
  }
}
