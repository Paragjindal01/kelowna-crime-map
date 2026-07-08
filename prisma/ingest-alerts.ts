import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real, publicly reported June–July 2026 events for the Community Alerts
// layer. Facts only (category, location, date) with our own short summaries —
// no article prose. Locations are approximate and flagged as such.
const alerts = [
  {
    category: "fire" as const,
    title: "Kalamoir Park wildfire",
    description:
      "8-hectare wildfire spread from Kalamoir Regional Park toward Casa Loma and Lakeview Heights; evacuation alerts lifted June 18 and the fire was held.",
    location: "Kalamoir Regional Park, West Kelowna",
    lat: 49.8355,
    lng: -119.5395,
    severity: 3,
    status: "resolved" as const,
    startsAt: new Date("2026-06-16T11:30:00-07:00"),
    sourceName: "Central Okanagan Emergency Operations",
    sourceUrl: "https://www.coemergency.ca/emergencies/kalamoir-park-wildfire",
    isVerified: true,
  },
  {
    category: "emergency" as const,
    title: "Suspicious device — Springfield Road closed",
    description:
      "Springfield Road closed between Spall and Cooper while the explosive disposal unit responded to a suspicious device near Springfield and Barlee.",
    location: "Springfield Rd between Spall Rd and Cooper Rd, Kelowna",
    lat: 49.8843,
    lng: -119.4426,
    severity: 3,
    status: "resolved" as const,
    startsAt: new Date("2026-07-06T12:00:00-07:00"),
    sourceName: "Castanet",
    sourceUrl: "https://www.castanet.net/news/Kelowna/",
    isVerified: false,
  },
  {
    category: "traffic" as const,
    title: "Serious crash — Highway 97 northbound at Hereron Road",
    description:
      "Northbound lanes of Highway 97 were closed at Hereron Road during a serious-crash investigation; the highway later fully reopened.",
    location: "Highway 97 at Hereron Rd, Kelowna",
    lat: 49.939,
    lng: -119.395,
    severity: 2,
    status: "resolved" as const,
    startsAt: new Date("2026-06-26T08:00:00-07:00"),
    sourceName: "Castanet",
    sourceUrl:
      "https://www.castanet.net/news/Kelowna/621866/Highway-97-fully-open-after-earlier-collision",
    isVerified: false,
  },
  {
    category: "traffic" as const,
    title: "Extrication crash — Highway 33 at Kneller/Gerstmar",
    description:
      "Collision requiring jaws-of-life extrication closed Highway 33 for about an hour; emergency crews responded around 7:45 p.m.",
    location: "Highway 33 at Kneller Rd / Gerstmar Rd, Rutland",
    lat: 49.8776,
    lng: -119.4054,
    severity: 2,
    status: "resolved" as const,
    startsAt: new Date("2026-06-19T19:45:00-07:00"),
    sourceName: "Castanet",
    sourceUrl:
      "https://www.castanet.net/news/Kelowna/620751/Emergency-crews-extricate-occupant-following-Kelowna-collision",
    isVerified: false,
  },
  {
    category: "public_notice" as const,
    title: "Increased police presence — Canada Day week",
    description:
      "Kelowna RCMP deployed additional officers downtown, in parks, and at beaches for Canada Day week and Touchdown Kelowna events; higher traffic expected near venues.",
    location: "Downtown Kelowna, parks and waterfront",
    lat: 49.8877,
    lng: -119.4961,
    severity: 1,
    status: "resolved" as const,
    startsAt: new Date("2026-06-29T09:00:00-07:00"),
    sourceName: "Kelowna RCMP",
    sourceUrl: "https://rcmp.ca/en/bc/kelowna/news/2026/06/4354505",
    isVerified: true,
  },
];

async function main() {
  let added = 0;
  for (const alert of alerts) {
    const existing = await prisma.alert.findFirst({
      where: { title: alert.title, startsAt: alert.startsAt },
    });
    if (existing) {
      console.log(`skip (exists): ${alert.title}`);
      continue;
    }
    await prisma.alert.create({
      data: {
        ...alert,
        moderation: "approved",
        locationApproximate: true,
      },
    });
    added += 1;
    console.log(`added: [${alert.category}] ${alert.title}`);
  }
  console.log(`\nDone — ${added} alert(s) added.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
