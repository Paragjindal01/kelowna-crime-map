-- CreateEnum
CREATE TYPE "CrimeType" AS ENUM ('vehicle_theft', 'theft_from_vehicle', 'residential_break_enter', 'commercial_break_enter', 'shoplifting', 'package_theft', 'bicycle_theft', 'vandalism_mischief', 'trespassing', 'suspicious_activity', 'assault', 'harassment_threats');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "type" "CrimeType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_status_occurredAt_idx" ON "Report"("status", "occurredAt");

-- CreateIndex
CREATE INDEX "Report_lat_lng_idx" ON "Report"("lat", "lng");
