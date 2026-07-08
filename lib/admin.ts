import prisma from "@/lib/prisma";

/** True only when ADMIN_KEY is set and the request carries the matching header. */
export function isAdmin(request: Request): boolean {
  const adminKey = request.headers.get("x-admin-key");
  return !!process.env.ADMIN_KEY && adminKey === process.env.ADMIN_KEY;
}

/** Records an admin action. Best-effort — never throws into the request path. */
export async function logAudit(
  request: Request,
  action: string,
  targetType: string,
  targetId: string,
  meta?: string
): Promise<void> {
  try {
    const label = request.headers.get("x-admin-label") || "admin";
    await prisma.auditLog.create({
      data: { action, targetType, targetId, label, meta: meta ?? null },
    });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
