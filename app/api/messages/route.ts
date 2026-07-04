import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { notify, publicUser } from "@/lib/community";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

// My message threads (as item owner or as helper), newest activity first.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const threads = await prisma.messageThread.findMany({
    where: { OR: [{ ownerId: user.id }, { otherId: user.id }] },
    include: {
      lostItem: { select: { id: true, title: true, status: true, imageUrl: true, ownerId: true } },
      owner: true,
      other: true,
      messages: { orderBy: { createdAt: "asc" }, take: 100, include: { sender: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    threads.map((t) => ({
      id: t.id,
      lostItem: t.lostItem,
      iAmOwner: t.ownerId === user.id,
      owner: publicUser(t.owner),
      other: publicUser(t.other),
      messages: t.messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        senderName: m.sender.name,
        createdAt: m.createdAt,
      })),
    }))
  );
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  if (!rateLimit(`message:${user.id}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json(rateLimited, { status: 429 });
  }

  const { threadId, body } = await request.json();
  const text = String(body ?? "").trim();
  if (!threadId || !text || text.length > 2000) {
    return NextResponse.json({ error: "Message required (max 2000 chars)" }, { status: 400 });
  }

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { lostItem: { select: { title: true } } },
  });
  if (!thread || (thread.ownerId !== user.id && thread.otherId !== user.id)) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: { threadId, senderId: user.id, body: text },
  });

  const recipient = thread.ownerId === user.id ? thread.otherId : thread.ownerId;
  await notify(recipient, `${user.name} replied about "${thread.lostItem.title}"`, "/dashboard");

  return NextResponse.json(message, { status: 201 });
}
