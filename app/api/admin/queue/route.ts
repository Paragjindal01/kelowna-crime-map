import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/admin";

// Combined pending-review queue across reports, lost & found, and alerts.
// Each entry is normalized to a common shape with a `kind` discriminator.
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reports = await prisma.report.findMany({
      where: { status: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const items = await prisma.lostItem.findMany({
      where: { moderation: "pending" },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    const alerts = await prisma.alert.findMany({
      where: { moderation: "pending" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    const queue = [
      ...reports.map((r) => ({
        kind: "report" as const,
        id: r.id,
        title: r.type.replace(/_/g, " "),
        category: r.type,
        description: r.description,
        date: r.occurredAt,
        location: r.address,
        images: [] as string[],
        status: r.status,
        isVerified: r.isVerified,
        locationApproximate: r.locationApproximate,
        sourceName: r.sourceName,
        sourceUrl: r.sourceUrl,
        submittedBy: r.user,
        createdAt: r.createdAt,
      })),
      ...items.map((i) => ({
        kind: "lostItem" as const,
        id: i.id,
        title: i.title,
        category: i.category,
        description: i.description,
        date: i.dateLost,
        location: i.location,
        images: i.imageUrls?.length ? i.imageUrls : i.imageUrl ? [i.imageUrl] : [],
        status: i.moderation,
        isVerified: false,
        locationApproximate: false,
        sourceName: null,
        sourceUrl: null,
        submittedBy: i.owner,
        createdAt: i.createdAt,
      })),
      ...alerts.map((a) => ({
        kind: "alert" as const,
        id: a.id,
        title: a.title,
        category: a.category,
        description: a.description,
        date: a.startsAt,
        location: a.location,
        images: [] as string[],
        status: a.moderation,
        isVerified: a.isVerified,
        locationApproximate: a.locationApproximate,
        sourceName: a.sourceName,
        sourceUrl: a.sourceUrl,
        submittedBy: a.user,
        createdAt: a.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(queue);
  } catch (error) {
    console.error("Error building admin queue:", error);
    return NextResponse.json({ error: "Failed to build queue" }, { status: 500 });
  }
}
