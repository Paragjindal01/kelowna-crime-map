import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { awardXp, notify, XP_VALUES } from "@/lib/community";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKey = request.headers.get("x-admin-key");

    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: { status },
    });

    // Reputation + notification for the submitting user
    if (existing.userId && existing.status !== status) {
      if (status === "approved") {
        await awardXp(existing.userId, XP_VALUES.report_approved, "Crime report approved");
        await notify(
          existing.userId,
          `Your report was approved — +${XP_VALUES.report_approved} XP`,
          "/dashboard"
        );
      } else {
        await notify(existing.userId, "Your report was reviewed but not published", "/dashboard");
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error updating report status:", error);
    return NextResponse.json({ error: "Failed to update report status" }, { status: 500 });
  }
}
