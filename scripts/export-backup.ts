/**
 * READ-ONLY backup + inspection. Writes timestamped JSON exports to
 * data/backups/ and a counts report to data/audit/. Never modifies the DB.
 *
 * Secrets policy: passwordHash, verifyToken, and session tokens are MASKED
 * in exports. The `contact` field on lost items is retained in the local
 * backup (needed to faithfully restore a deleted record) — backups are
 * gitignored and must never be committed or shared.
 *
 * Run: npx tsx scripts/export-backup.ts
 */
import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "data", "backups", stamp);
  await mkdir(backupDir, { recursive: true });

  const users = (await prisma.user.findMany()).map((u) => ({
    ...u,
    passwordHash: "***MASKED***",
    verifyToken: u.verifyToken ? "***MASKED***" : null,
  }));
  const reports = await prisma.report.findMany();
  const alerts = await prisma.alert.findMany();
  const lostItems = await prisma.lostItem.findMany();
  const comments = await prisma.comment.findMany();
  const threads = await prisma.messageThread.findMany();
  const messages = await prisma.message.findMany();
  const notifications = await prisma.notification.findMany();
  const xpEvents = await prisma.xpEvent.findMany();
  const auditLogs = await prisma.auditLog.findMany();
  const featureVotes = await prisma.featureVote.findMany();

  const dump: Record<string, unknown[]> = {
    users, reports, alerts, lostItems, comments,
    messageThreads: threads, messages, notifications, xpEvents, auditLogs, featureVotes,
  };
  for (const [name, rows] of Object.entries(dump)) {
    await writeFile(path.join(backupDir, `${name}.json`), JSON.stringify(rows, null, 2));
  }

  // Counts report
  const by = <T,>(rows: T[], key: (r: T) => string) =>
    rows.reduce<Record<string, number>>((acc, r) => { const k = key(r); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
  const month = (d: Date) => d.toISOString().slice(0, 7);

  const counts = {
    generatedAt: new Date().toISOString(),
    backupDir,
    totals: Object.fromEntries(Object.entries(dump).map(([k, v]) => [k, v.length])),
    reportsByStatus: by(reports, (r) => r.status),
    reportsBySource: by(reports, (r) => r.sourceName ?? "community/none"),
    reportsByMonth: by(reports, (r) => month(r.createdAt)),
    alertsByModeration: by(alerts, (a) => a.moderation),
    alertsByStatus: by(alerts, (a) => a.status),
    alertsBySource: by(alerts, (a) => a.sourceName ?? "community/none"),
    lostItemsByModeration: by(lostItems, (i) => i.moderation),
    lostItemsByStatus: by(lostItems, (i) => i.status),
    usersByMonth: by(users, (u) => month(u.createdAt as Date)),
  };
  await mkdir(path.join(process.cwd(), "data", "audit"), { recursive: true });
  const countsPath = path.join(process.cwd(), "data", "audit", `counts-${stamp}.json`);
  await writeFile(countsPath, JSON.stringify(counts, null, 2));
  console.log(JSON.stringify(counts, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
