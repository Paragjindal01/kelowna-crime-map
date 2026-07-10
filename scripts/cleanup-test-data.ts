/**
 * Test-data cleanup. DRY-RUN by default — prints what would be deleted.
 * Apply with:            npx tsx scripts/cleanup-test-data.ts --apply
 * Include "possibly" set: npx tsx scripts/cleanup-test-data.ts --apply --include-possible
 *
 * Deletes inside a single transaction, removes orphaned Blob images, and
 * writes an AuditLog row. IDs are pinned to the reviewed deletion preview
 * (data/import-preview/deletion-preview-2026-07-10.json) — nothing else is touched.
 */
import { PrismaClient } from "@prisma/client";
import { del } from "@vercel/blob";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const INCLUDE_POSSIBLE = process.argv.includes("--include-possible");

// Pinned from the approved deletion preview — do not widen programmatically.
const DEFINITE = {
  users: ["cmr63tkqh0000r9xc2nx7rjul", "cmr64i94x0000r9f91i62bmty"], // Sam Tester, Vera Verified
  lostItems: ["cmr63vx9u0002r9xcx01px9u2"], // Blue backpack with laptop
};
const POSSIBLE = {
  lostItems: ["cmrbjunqh0001l204s4fi191f"], // Iphone 15 (Parag's upload test, has Blob image)
  reports: ["cmpi7p0i70000jy04dlzfc5cq"], // rejected 690 Hollydell Rd test submission
};

async function main() {
  const itemIds = [...DEFINITE.lostItems, ...(INCLUDE_POSSIBLE ? POSSIBLE.lostItems : [])];
  const reportIds = INCLUDE_POSSIBLE ? POSSIBLE.reports : [];
  const userIds = DEFINITE.users;

  const items = await prisma.lostItem.findMany({ where: { id: { in: itemIds } } });
  const reports = await prisma.report.findMany({ where: { id: { in: reportIds } } });
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"} (possible-set: ${INCLUDE_POSSIBLE})`);
  console.log("Will delete lost items:", items.map((i) => `${i.id} "${i.title}"`));
  console.log("Will delete reports:", reports.map((r) => `${r.id} ${r.type} (${r.status})`));
  console.log("Will delete users:", users.map((u) => `${u.id} "${u.name}"`));

  // Blob images on deleted items — confirm not shared with any surviving record.
  const blobUrls = items.flatMap((i) => [i.imageUrl, ...i.imageUrls]).filter((u): u is string => !!u && u.startsWith("http"));
  const shared = blobUrls.length
    ? await prisma.lostItem.findMany({
        where: { id: { notIn: itemIds }, OR: blobUrls.flatMap((u) => [{ imageUrl: u }, { imageUrls: { has: u } }]) },
        select: { id: true },
      })
    : [];
  const safeBlobUrls = shared.length === 0 ? blobUrls : [];
  console.log("Blob images to delete:", safeBlobUrls);

  if (!APPLY) {
    console.log("\nDRY-RUN complete — nothing was modified. Re-run with --apply to execute.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (itemIds.length) await tx.lostItem.deleteMany({ where: { id: { in: itemIds } } });
    if (reportIds.length) await tx.report.deleteMany({ where: { id: { in: reportIds } } });
    // User delete cascades sessions/notifications/xp per schema FKs.
    if (userIds.length) await tx.user.deleteMany({ where: { id: { in: userIds } } });
    await tx.auditLog.create({
      data: {
        action: "test_data_cleanup",
        targetType: "batch",
        targetId: `cleanup-${new Date().toISOString().slice(0, 10)}`,
        label: "admin",
        meta: JSON.stringify({ users: userIds, lostItems: itemIds, reports: reportIds }),
      },
    });
  });

  if (safeBlobUrls.length && process.env.BLOB_READ_WRITE_TOKEN) {
    try { await del(safeBlobUrls); console.log("Blob images deleted."); }
    catch (e) { console.error("Blob deletion failed (records already removed):", e); }
  }

  const counts = {
    users: await prisma.user.count(),
    reports: await prisma.report.count(),
    alerts: await prisma.alert.count(),
    lostItems: await prisma.lostItem.count(),
  };
  console.log("APPLIED. Post-cleanup counts:", counts);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
