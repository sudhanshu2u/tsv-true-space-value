import { NextRequest, NextResponse } from "next/server";
import { TSVClaudeProvider } from "@/lib/tsv/claude-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 503 });
  }

  let body: { imageDataUrl: string };
  try {
    body = (await req.json()) as { imageDataUrl: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.imageDataUrl?.startsWith("data:image/")) {
    return NextResponse.json({ error: "imageDataUrl must be a base64 image data URL." }, { status: 400 });
  }

  // Rough size check — base64 of 10MB image ≈ 13.3M chars; reject above 15MB source
  if (body.imageDataUrl.length > 20_000_000) {
    return NextResponse.json({ error: "Image too large. Please upload under 15MB." }, { status: 413 });
  }

  try {
    const provider = new TSVClaudeProvider(apiKey);
    const analysis = await provider.analyzeFloorPlan(body.imageDataUrl);
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Floor plan analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
