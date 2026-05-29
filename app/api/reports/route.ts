import { NextRequest, NextResponse } from "next/server";
import { getTSVReport, listTSVReports } from "@/lib/tsv/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const report = await getTSVReport(id);
    if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json(report);
  }

  // List / filter
  const city = searchParams.get("city") ?? undefined;
  const unitType = searchParams.get("unitType") ?? undefined;
  const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

  const entries = await listTSVReports({ city, unitType, minScore, maxPrice, search, limit });
  return NextResponse.json({ entries });
}
