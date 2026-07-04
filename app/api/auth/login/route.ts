import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, clientIp, rateLimited } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    if (!rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const { email, password } = await request.json();
    const cleanEmail = String(email ?? "").trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || !verifyPassword(String(password ?? ""), user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.banned) {
      return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });
    }

    await createSession(user.id);
    return NextResponse.json({ id: user.id, name: user.name });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
