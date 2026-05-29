import { NextRequest, NextResponse } from "next/server";
import { getTSVReportsByIds } from "@/lib/tsv/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "Provide ?ids=id1,id2,id3 (up to 3)." }, { status: 400 });
  }

  const ids = idsParam.split(",").slice(0, 3).map((s) => s.trim()).filter(Boolean);
  if (ids.length < 2) {
    return NextResponse.json({ error: "Provide at least 2 report IDs to compare." }, { status: 400 });
  }

  const reports = await getTSVReportsByIds(ids);
  return NextResponse.json({ reports });
}
