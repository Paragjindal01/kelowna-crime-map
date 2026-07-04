import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { notify } from "@/lib/community";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  const user = await prisma.user.findUnique({ where: { verifyToken: token } });
  if (!user) {
    return NextResponse.redirect(`${origin}/login?verify=invalid`);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verifyToken: null },
  });
  await notify(user.id, "Your email is verified — you can now post items and message owners ✓", "/dashboard");

  return NextResponse.redirect(`${origin}/dashboard?verified=1`);
}
