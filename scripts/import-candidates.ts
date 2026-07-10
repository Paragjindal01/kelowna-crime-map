/**
 * Imports reviewed candidates from data/import-preview/candidates-2026-07-10.json.
 * DRY-RUN by default. Apply: npx tsx scripts/import-candidates.ts --apply
 *
 * Safety:
 * - only candidates with "select": true are imported
 * - re-checks duplicates against the live DB by sourceUrl and title+date
 * - everything is created with moderation/status = PENDING (never auto-published)
 * - writes a manifest of created IDs to data/backups/ for exact rollback
 * - records the batch in AuditLog
 * - continues past individual failures, reporting them at the end
 */
import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const CANDIDATES_FILE = path.join(process.cwd(), "data", "import-preview", "candidates-2026-07-10.json");

async function main() {
  const spec = JSON.parse(await readFile(CANDIDATES_FILE, "utf8"));
  const batchId: string = spec.batchId;
  const manifest: { model: string; id: string; title: string }[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];

  const reports = (spec.reports ?? []).filter((r: any) => r.select);
  const alerts = (spec.alerts ?? []).filter((a: any) => a.select);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"} · batch ${batchId}`);
  console.log(`Selected: ${reports.length} reports, ${alerts.length} alerts, ${(spec.lostFound ?? []).length} lost&found`);

  for (const r of reports) {
    const dup = await prisma.report.findFirst({
      where: {
        OR: [
          { sourceUrl: r.sourceUrl },
          { AND: [{ address: r.address }, { occurredAt: new Date(r.occurredAt) }] },
        ],
      },
    });
    if (dup) { skipped.push(`report dup: ${r.address} (matches ${dup.id})`); continue; }
    if (!APPLY) { console.log(`[dry-run] would import report: ${r.type} @ ${r.address}`); continue; }
    try {
      const created = await prisma.report.create({
        data: {
          type: r.type,
          status: "pending", // admin must review before it becomes public
          occurredAt: new Date(r.occurredAt),
          address: r.address,
          description: r.description,
          lat: r.lat,
          lng: r.lng,
          isVerified: !!r.isVerified,
          locationApproximate: true,
          sourceName: r.sourceName,
          sourceUrl: r.sourceUrl,
        },
      });
      manifest.push({ model: "report", id: created.id, title: r.address });
    } catch (e: any) { failed.push(`report ${r.address}: ${e.message}`); }
  }

  for (const a of alerts) {
    const dup = await prisma.alert.findFirst({
      where: { OR: [{ sourceUrl: a.sourceUrl }, { AND: [{ title: a.title }, { startsAt: new Date(a.startsAt) }] }] },
    });
    if (dup) { skipped.push(`alert dup: ${a.title} (matches ${dup.id})`); continue; }
    if (!APPLY) { console.log(`[dry-run] would import alert: [${a.category}] ${a.title}`); continue; }
    try {
      const created = await prisma.alert.create({
        data: {
          category: a.category,
          title: a.title,
          description: a.description,
          location: a.location,
          lat: a.lat,
          lng: a.lng,
          severity: a.severity ?? 2,
          status: a.status ?? "active",
          moderation: "pending", // admin must review
          startsAt: new Date(a.startsAt),
          sourceName: a.sourceName,
          sourceUrl: a.sourceUrl,
          isVerified: !!a.isVerified,
          locationApproximate: true,
        },
      });
      manifest.push({ model: "alert", id: created.id, title: a.title });
    } catch (e: any) { failed.push(`alert ${a.title}: ${e.message}`); }
  }

  if (APPLY) {
    const dir = path.join(process.cwd(), "data", "backups");
    await mkdir(dir, { recursive: true });
    const manifestPath = path.join(dir, `${batchId}-manifest.json`);
    await writeFile(manifestPath, JSON.stringify({ batchId, importedAt: new Date().toISOString(), records: manifest, skipped, failed }, null, 2));
    await prisma.auditLog.create({
      data: {
        action: "import_batch",
        targetType: "batch",
        targetId: batchId,
        label: "admin",
        meta: JSON.stringify({ created: manifest.length, skipped: skipped.length, failed: failed.length }),
      },
    });
    console.log(`Manifest written: ${manifestPath}`);
  }

  console.log(`\nResult — created: ${manifest.length}, duplicates skipped: ${skipped.length}, failed: ${failed.length}`);
  if (skipped.length) console.log("Skipped:", skipped);
  if (failed.length) console.log("Failed:", failed);
  if (!APPLY) console.log("DRY-RUN complete — nothing was written.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
