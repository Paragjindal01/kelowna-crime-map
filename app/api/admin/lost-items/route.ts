import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const adminKey = request.headers.get("x-admin-key");
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.lostItem.findMany({
      where: { moderation: "pending" },
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching pending lost items:", error);
    return NextResponse.json({ error: "Failed to fetch lost items" }, { status: 500 });
  }
}
