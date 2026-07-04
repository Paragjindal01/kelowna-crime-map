import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { levelForXp } from "@/lib/community";
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null });

  const unread = await prisma.notification.count({
    where: { userId: user.id, readAt: null },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      emailVerified: user.emailVerified,
      xp: user.xp,
      level: levelForXp(user.xp),
      unreadNotifications: unread,
    },
  });
}
