import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/mail";
import { rateLimit, rateLimited } from "@/lib/ratelimit";

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!rateLimit(`resend:${user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(rateLimited, { status: 429 });
  }
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  const token = crypto.randomBytes(24).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { verifyToken: token } });
  await sendVerificationEmail(user.email, user.name, token);

  return NextResponse.json({ ok: true });
}
