import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// News-sourced incidents. Only factual data (type, location, date) is stored —
// no article prose is copied. Each links back to the source and is flagged as
// an approximate location, since news stories rarely give exact coordinates.
const incidents = [
  {
    type: "suspicious_activity" as const,
    occurredAt: new Date("2026-07-02T07:30:00-07:00"),
    address: "Bernard Ave & Gordon Dr, downtown Kelowna",
    lat: 49.8875,
    lng: -119.4936,
    description:
      "Report of a man with what looked like a handgun; police determined it was a replica lighter.",
    sourceName: "Castanet",
    sourceUrl:
      "https://www.castanet.net/news/Kelowna/622838/Replica-gun-lighter-sparks-high-risk-RCMP-response-in-Kelowna",
  },
  {
    type: "vehicle_theft" as const,
    occurredAt: new Date("2026-06-24T09:00:00-07:00"),
    address: "2000 block Applegreen Court, West Kelowna",
    lat: 49.8583,
    lng: -119.6072,
    description:
      "Man arrested after arriving in a stolen vehicle and unloading stolen goods, including a bicycle.",
    sourceName: "Castanet",
    sourceUrl:
      "https://www.castanet.net/news/West-Kelowna/622526/Stolen-vehicle-arrest-at-troubled-West-Kelowna-property",
  },
  {
    type: "vandalism_mischief" as const,
    occurredAt: new Date("2026-07-07T02:00:00-07:00"),
    address: "McCurdy Rd / Phipps Cres / Keyes Rd area, Rutland",
    lat: 49.9046,
    lng: -119.3752,
    description:
      "Vehicle windows smashed and cars/fences spray-painted overnight; a pool liner was slashed.",
    sourceName: "Kelowna Capital News",
    sourceUrl:
      "https://www.kelownacapnews.com/news/rcmp-still-searching-for-bike-thieves-and-rutland-vandals-in-kelowna/",
  },
  {
    type: "vandalism_mischief" as const,
    occurredAt: new Date("2026-06-25T03:00:00-07:00"),
    address: "Rutland Sports fields washrooms, Rutland",
    lat: 49.888,
    lng: -119.3928,
    description: "Newly renovated public washrooms trashed — repeat mischief at the sports fields.",
    sourceName: "Kelowna Capital News",
    sourceUrl:
      "https://www.kelownacapnews.com/news/rcmp-still-searching-for-bike-thieves-and-rutland-vandals-in-kelowna/",
  },
];

async function main() {
  let added = 0;
  for (const inc of incidents) {
    // Skip if the same source article is already ingested at this location
    const existing = await prisma.report.findFirst({
      where: { sourceUrl: inc.sourceUrl, lat: inc.lat, lng: inc.lng },
    });
    if (existing) {
      console.log(`skip (exists): ${inc.address}`);
      continue;
    }
    await prisma.report.create({
      data: {
        ...inc,
        status: "approved",
        isVerified: true,
        locationApproximate: true,
        privacyLevel: "public",
      },
    });
    added += 1;
    console.log(`added: ${inc.type} @ ${inc.address}`);
  }
  console.log(`\nDone — ${added} incident(s) added.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
