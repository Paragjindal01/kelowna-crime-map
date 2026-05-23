import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

export type ManualReport = {
  id: string;
  type: string;
  status: "approved";
  occurredAt: string;
  lat: number;
  lng: number;
  address: string;
  description: string;
};

const filePath = path.join(
  process.cwd(),
  "data",
  "Kelownacrimejan.csv"
);

const fileContent = fs.readFileSync(filePath, "utf-8");

const records: any[] = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
});

export const manualReports = records
  .map((row: any, index: number): ManualReport => {
    return {
      id: row.incident_id || `csv-${index + 1}`,
      type: row.crime_type || "unknown",
      status: "approved",
      occurredAt: new Date(row.incident_date).toISOString(),
      lat: parseFloat(row.latitude),
      lng: parseFloat(row.longitude),
      address: row.location_name || "Kelowna, BC",
      description:
        row.location_text || row.crime_type || "Kelowna crime",
    };
  })
  .filter((r) => !isNaN(r.lat) && !isNaN(r.lng));