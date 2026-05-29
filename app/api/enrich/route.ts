import { NextRequest, NextResponse } from "next/server";
import { enrichProjectFromWeb } from "@/lib/tsv/web-enrichment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { projectName?: string; city?: string; locality?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { projectName, city, locality } = body;
  if (!projectName || !city) {
    return NextResponse.json({ error: "projectName and city are required." }, { status: 400 });
  }

  const result = await enrichProjectFromWeb(
    projectName,
    city,
    locality,
    process.env.ANTHROPIC_API_KEY,
    process.env.TAVILY_API_KEY,
  );

  if (!result) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, ...result });
}
