import { NextResponse } from "next/server";
import { manualReports } from "@/data/manualReports";

export async function GET() {
  return NextResponse.json(manualReports);
}
