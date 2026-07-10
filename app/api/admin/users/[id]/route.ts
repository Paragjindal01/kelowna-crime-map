import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin, logAudit } from "@/lib/admin";
import { validateDisplayName } from "@/lib/names";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { banned, name } = body;

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (banned !== undefined) {
      if (typeof banned !== "boolean") {
        return NextResponse.json({ error: "banned must be a boolean" }, { status: 400 });
      }
      data.banned = banned;
    }

    // Moderation rename — user's posts stay, only the public display name changes.
    if (name !== undefined) {
      const check = validateDisplayName(name);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }
      data.name = check.name;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const user = await prisma.user.update({ where: { id }, data });

    // Kill active sessions when banning
    if (data.banned === true) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    if (data.banned !== undefined) {
      await logAudit(request, data.banned ? "user_banned" : "user_unbanned", "user", id);
    }
    if (data.name !== undefined) {
      await logAudit(request, "user_renamed", "user", id, `"${existing.name}" -> "${data.name}"`);
    }

    return NextResponse.json({ id: user.id, banned: user.banned, name: user.name });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
