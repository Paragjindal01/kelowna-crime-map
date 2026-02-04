import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.report.createMany({
    data: [
      {
        type: "vehicle_theft",
        status: "approved",
        occurredAt: new Date("2025-01-15"),
        lat: 49.888,
        lng: -119.496,
        address: "Downtown Kelowna",
        description: "Car stolen overnight",
      },
      {
        type: "residential_break_enter",
        status: "approved",
        occurredAt: new Date("2025-01-20"),
        lat: 49.884,
        lng: -119.475,
        address: "Rutland",
        description: "Back door forced open",
      },
      {
        type: "commercial_break_enter",
        status: "approved",
        occurredAt: new Date("2025-01-22"),
        lat: 49.892,
        lng: -119.485,
        address: "Harvey Ave",
        description: "Shop break-in after hours",
      },
      {
        type: "package_theft",
        status: "approved",
        occurredAt: new Date("2025-01-25"),
        lat: 49.899,
        lng: -119.502,
        address: "Glenmore",
        description: "Package taken from porch",
      },
      {
        type: "bicycle_theft",
        status: "approved",
        occurredAt: new Date("2025-01-27"),
        lat: 49.879,
        lng: -119.497,
        address: "Mission",
        description: "Bike stolen from rack",
      },
    ],
  });
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
