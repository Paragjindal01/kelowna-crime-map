import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.report.findFirst({
    where: { sourceId: "RCMP-2026-3017" },
  });

  if (!existing) {
    await prisma.report.create({
      data: {
        sourceId: "RCMP-2026-3017",
        type: "vandalism_mischief",
        occurredAt: new Date("2026-01-16T12:00:00.000Z"),
        address: "500-block Bernard Avenue, Kelowna, BC",
        lat: 49.8869,
        lng: -119.4956,
        description: "**Downtown property crime offender arrested**\n\nKelowna RCMP responded to a mischief in progress at a business in the 500-block of Bernard Avenue. A male was arrested.",
        sourceName: "Kelowna RCMP News Release",
        sourceUrl: "https://rcmp.ca/en/bc/kelowna/news/2026/01/4349502",
        status: "approved",
        isVerified: true,
        privacyLevel: "public",
        locationApproximate: true,
      },
    });
    console.log("🌱 Inserted RCMP-2026-3017 case.");
  } else {
    await prisma.report.update({
      where: { id: existing.id },
      data: { occurredAt: new Date("2026-01-16T12:00:00.000Z") }
    });
    console.log("🌱 RCMP-2026-3017 case already exists. Updated occurredAt.");
  }
}

main()
  .then(() => {
    console.log("🌱 Database seeded");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
