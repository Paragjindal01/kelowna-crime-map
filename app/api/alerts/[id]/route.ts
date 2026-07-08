import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

// Reporter can mark their own alert resolved (or re-activate it).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const { id } = await params;
    const { status } = await request.json();

    if (status !== "active" && status !== "resolved") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    if (alert.userId !== user.id) {
      return NextResponse.json({ error: "Only the reporter can update this alert" }, { status: 403 });
    }

    const updated = await prisma.alert.update({ where: { id }, data: { status } });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
