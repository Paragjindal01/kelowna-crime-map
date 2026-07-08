import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { isAdmin, logAudit } from "@/lib/admin";

// Admin list: filter by moderation (?status=pending|approved|rejected|all).
export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const status = new URL(request.url).searchParams.get("status") || "pending";
    const where = status === "all" ? {} : { moderation: status as any };

    const items = await prisma.lostItem.findMany({
      where,
      include: { owner: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching lost items:", error);
    return NextResponse.json({ error: "Failed to fetch lost items" }, { status: 500 });
  }
}

// Admin manual creation of a lost/found listing — published immediately.
export async function POST(request: Request) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const admin = await getSessionUser();
    const body = await request.json();

    const title = String(body.title ?? "").trim().slice(0, 80);
    const category = String(body.category ?? "").trim().slice(0, 40);
    const location = String(body.location ?? "").trim().slice(0, 120);
    if (!title || !category || !location) {
      return NextResponse.json({ error: "Title, category, and location are required" }, { status: 400 });
    }
    const status = ["lost", "found", "returned"].includes(body.status) ? body.status : "found";
    const dateLost = body.dateLost ? new Date(body.dateLost) : new Date();

    const item = await prisma.lostItem.create({
      data: {
        title,
        category,
        description: typeof body.description === "string" ? body.description.slice(0, 1000) || null : null,
        location,
        dateLost: Number.isNaN(dateLost.getTime()) ? new Date() : dateLost,
        contact: admin?.email ?? "admin",
        status: status as any,
        moderation: "approved",
        ownerId: admin?.id ?? null,
      },
    });

    await logAudit(request, "item_created", "lostItem", item.id);
    const { contact, ...safe } = item;
    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    console.error("Error creating admin lost item:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
