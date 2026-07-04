import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PLANNED_FEATURES } from "@/lib/roadmap";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

const VALID_KEYS = new Set(PLANNED_FEATURES.map((f) => f.key));

export async function GET() {
  try {
    const user = await getSessionUser();

    const counts = await prisma.featureVote.groupBy({
      by: ["featureKey"],
      _count: { featureKey: true },
    });
    const countMap = new Map(counts.map((c) => [c.featureKey, c._count.featureKey]));

    let myVotes: string[] = [];
    if (user) {
      const mine = await prisma.featureVote.findMany({
        where: { userId: user.id },
        select: { featureKey: true },
      });
      myVotes = mine.map((v) => v.featureKey);
    }

    return NextResponse.json({
      votes: Object.fromEntries(PLANNED_FEATURES.map((f) => [f.key, countMap.get(f.key) ?? 0])),
      myVotes,
      signedIn: Boolean(user),
    });
  } catch (error) {
    console.error("Roadmap error:", error);
    return NextResponse.json({ votes: {}, myVotes: [], signedIn: false });
  }
}

// Toggle a vote
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in to vote" }, { status: 401 });

  if (!rateLimit(`vote:${user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json(rateLimited, { status: 429 });
  }

  const { featureKey } = await request.json();
  if (!VALID_KEYS.has(featureKey)) {
    return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
  }

  const existing = await prisma.featureVote.findUnique({
    where: { featureKey_userId: { featureKey, userId: user.id } },
  });

  if (existing) {
    await prisma.featureVote.delete({ where: { id: existing.id } });
    return NextResponse.json({ voted: false });
  }

  await prisma.featureVote.create({ data: { featureKey, userId: user.id } });
  return NextResponse.json({ voted: true });
}
