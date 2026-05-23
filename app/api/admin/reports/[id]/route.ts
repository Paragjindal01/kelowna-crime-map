import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKey = request.headers.get("x-admin-key");

    if (process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report status:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}