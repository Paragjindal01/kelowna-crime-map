import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notify, publicUser } from "@/lib/community";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetType = searchParams.get("targetType");
  const targetId = searchParams.get("targetId");

  if (!targetType || !targetId || !["report", "lost_item"].includes(targetType)) {
    return NextResponse.json([], { status: 200 });
  }

  const comments = await prisma.comment.findMany({
    where: { targetType, targetId, hidden: false },
    include: { user: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json(
    comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      user: publicUser(c.user),
    }))
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment" }, { status: 401 });
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before commenting — resend from your dashboard" },
      { status: 403 }
    );
  }

  if (!rateLimit(`comment:${user.id}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json(rateLimited, { status: 429 });
  }

  const { targetType, targetId, body } = await request.json();
  const text = String(body ?? "").trim();

  if (!["report", "lost_item"].includes(targetType) || !targetId || !text || text.length > 1000) {
    return NextResponse.json({ error: "Comment required (max 1000 chars)" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: { targetType, targetId, userId: user.id, body: text },
  });

  // Notify the content owner (if any and not self)
  if (targetType === "lost_item") {
    const item = await prisma.lostItem.findUnique({ where: { id: targetId } });
    if (item?.ownerId && item.ownerId !== user.id) {
      await notify(item.ownerId, `${user.name} commented on "${item.title}"`, "/lost-found");
    }
  } else {
    const report = await prisma.report.findUnique({ where: { id: targetId } });
    if (report?.userId && report.userId !== user.id) {
      await notify(report.userId, `${user.name} commented on your report`, "/map");
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
