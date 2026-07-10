/**
 * Rolls back an import batch using its manifest (exact record IDs only).
 * DRY-RUN by default. Apply: npx tsx scripts/rollback-import.ts <batchId> --apply
 *
 * - deletes ONLY records created by that batch
 * - warns (and skips unless --force) if a record was edited after import
 * - logs the rollback in AuditLog
 */
import { PrismaClient } from "@prisma/client";
import { readFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");
const batchId = process.argv.find((a) => !a.startsWith("--") && !a.includes("/") && a.startsWith("import-"));

async function main() {
  if (!batchId) { console.error("Usage: npx tsx scripts/rollback-import.ts <batchId> [--apply] [--force]"); process.exit(1); }
  const manifestPath = path.join(process.cwd(), "data", "backups", `${batchId}-manifest.json`);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"} · rolling back ${manifest.records.length} records from ${batchId}`);

  let deleted = 0, skippedEdited = 0, missing = 0;
  for (const rec of manifest.records) {
    const row = rec.model === "report"
      ? await prisma.report.findUnique({ where: { id: rec.id } })
      : await prisma.alert.findUnique({ where: { id: rec.id } });
    if (!row) { missing++; continue; }
    const edited = row.updatedAt.getTime() - row.createdAt.getTime() > 5000;
    if (edited && !FORCE) {
      console.log(`SKIP (edited after import — use --force to remove): ${rec.model} ${rec.id} "${rec.title}"`);
      skippedEdited++;
      continue;
    }
    if (APPLY) {
      if (rec.model === "report") await prisma.report.delete({ where: { id: rec.id } });
      else await prisma.alert.delete({ where: { id: rec.id } });
    }
    deleted++;
  }

  if (APPLY) {
    await prisma.auditLog.create({
      data: { action: "import_rollback", targetType: "batch", targetId: batchId, label: "admin",
        meta: JSON.stringify({ deleted, skippedEdited, missing }) },
    });
  }
  console.log(`Result — ${APPLY ? "deleted" : "would delete"}: ${deleted}, edited-skipped: ${skippedEdited}, already gone: ${missing}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
