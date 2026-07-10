import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit, clientIp, rateLimited } from "@/lib/ratelimit";
import { validateDisplayName } from "@/lib/names";

const AVATAR_COLORS = ["#b3823f", "#8c3b5d", "#6f8f4f", "#a1583c", "#7d5a8c", "#b3593f"];

export async function POST(request: Request) {
  try {
    if (!rateLimit(`signup:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(rateLimited, { status: 429 });
    }

    const { email, password, name } = await request.json();

    const cleanEmail = String(email ?? "").trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    const nameCheck = validateDisplayName(name);
    if (!nameCheck.ok) {
      return NextResponse.json({ error: nameCheck.error }, { status: 400 });
    }
    const cleanName = nameCheck.name;

    // Best-effort case-insensitive uniqueness so two members don't appear
    // publicly under visually identical names.
    const nameTaken = await prisma.user.findFirst({
      where: { name: { equals: cleanName, mode: "insensitive" } },
      select: { id: true },
    });
    if (nameTaken) {
      return NextResponse.json({ error: "That display name is already in use — please choose another" }, { status: 409 });
    }
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const verifyToken = crypto.randomBytes(24).toString("hex");

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: cleanName,
        passwordHash: hashPassword(password),
        avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
        verifyToken,
      },
    });

    await createSession(user.id);

    try {
      await sendVerificationEmail(user.email, user.name, verifyToken);
    } catch (e) {
      console.error("Failed to send verification email:", e);
    }

    return NextResponse.json({ id: user.id, name: user.name }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
