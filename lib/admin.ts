import prisma from "@/lib/prisma";
import crypto from "crypto";

/**
 * True only when ADMIN_KEY is set and the request carries the matching header.
 * Fails closed when the env var is missing; comparison is constant-time.
 */
export function isAdmin(request: Request): boolean {
  const provided = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_KEY;
  if (!expected || !provided) return false;
  // Hash both sides so timingSafeEqual gets equal-length buffers.
  const a = crypto.createHash("sha256").update(provided).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
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
