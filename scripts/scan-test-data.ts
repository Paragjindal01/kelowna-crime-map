// READ-ONLY: prints candidate test data with masked emails for categorization.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const mask = (e: string) => e.replace(/^(.{2})[^@]*@/, "$1***@");
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, emailVerified: true, xp: true, createdAt: true,
      _count: { select: { reports: true, lostItems: true, alerts: true, comments: true } } },
  });
  const items = await prisma.lostItem.findMany({
    select: { id: true, title: true, category: true, location: true, description: true, contact: true,
      imageUrl: true, imageUrls: true, status: true, moderation: true, createdAt: true, ownerId: true },
  });
  const reports = await prisma.report.findMany({
    select: { id: true, type: true, status: true, address: true, description: true, sourceName: true,
      occurredAt: true, createdAt: true, userId: true, isVerified: true },
  });
  console.log(JSON.stringify({
    users: users.map(u => ({ ...u, email: mask(u.email) })),
    lostItems: items.map(i => ({ ...i, contact: mask(i.contact) })),
    reports,
  }, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
