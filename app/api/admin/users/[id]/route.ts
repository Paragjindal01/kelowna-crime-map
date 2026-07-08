import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin, logAudit } from "@/lib/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { banned } = await request.json();

    if (typeof banned !== "boolean") {
      return NextResponse.json({ error: "banned must be a boolean" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { banned },
    });

    // Kill active sessions when banning
    if (banned) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    await logAudit(request, banned ? "user_banned" : "user_unbanned", "user", id);

    return NextResponse.json({ id: user.id, banned: user.banned });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
