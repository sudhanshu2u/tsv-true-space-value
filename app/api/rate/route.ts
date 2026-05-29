import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { TSVInput, TSVReport } from "@/lib/tsv/types";
import {
  computeCompleteness,
  computeTSVCore,
  computeTSVBuilding,
  computeTSVValue,
  computeComposite,
  computeCityNormalized,
  getVerdictLabel,
  deriveStrengths,
  deriveWeaknesses,
} from "@/lib/tsv/scoring";
import { TSVClaudeProvider } from "@/lib/tsv/claude-provider";
import { saveTSVReport } from "@/lib/tsv/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let input: TSVInput;
  try {
    input = (await req.json()) as TSVInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // At minimum we need a floor plan image OR some space data
  const hasMinimum = !!(
    input.floorPlanImage ||
    input.carpetArea ||
    (input.bedrooms && input.bedrooms > 0)
  );

  if (!hasMinimum) {
    return NextResponse.json(
      { error: "Please upload a floor plan image or provide at least carpet area or bedroom count." },
      { status: 400 },
    );
  }

  const completeness = computeCompleteness(input);

  // If floor plan image provided but space fields empty, run vision analysis first
  const apiKey = process.env.ANTHROPIC_API_KEY;
  let planObservations: string[] = [];

  if (input.floorPlanImage && !input.carpetArea && apiKey) {
    try {
      const provider = new TSVClaudeProvider(apiKey);
      const analysis = await provider.analyzeFloorPlan(input.floorPlanImage);
      // Merge analysis into input (do not overwrite user-provided values)
      input = {
        ...input,
        bedrooms: input.bedrooms ?? analysis.bedrooms,
        bathrooms: input.bathrooms ?? analysis.bathrooms,
        carpetArea: input.carpetArea ?? analysis.estimatedCarpetAreaSqFt,
        passageAreaPercent: input.passageAreaPercent ?? analysis.passageAreaPercent,
        roomsRectangular: input.roomsRectangular ?? analysis.roomsRectangular,
        dryBalconyPresent: input.dryBalconyPresent ?? analysis.dryBalconyPresent,
        storagePresent: input.storagePresent ?? analysis.storagePresent,
        externalWindowsCount: input.externalWindowsCount ?? analysis.externalWindowsCount,
        crossVentilation: input.crossVentilation ?? analysis.crossVentilation,
      };
      if (analysis.notes) {
        planObservations = analysis.notes.split(/[.·•]/).map((s) => s.trim()).filter((s) => s.length > 10);
      }
    } catch {
      // Vision analysis failed — continue with whatever data we have
    }
  }

  // Deterministic scoring
  const core = computeTSVCore(input);
  const building = computeTSVBuilding(input);
  const value = computeTSVValue(input, core.total);
  const composite = computeComposite(core, building, value);
  const cityNormalized = input.city
    ? computeCityNormalized(composite, input.city, input.unitType ?? "2BHK")
    : composite;
  const { label: verdictLabel, color: verdictColor } = getVerdictLabel(composite);
  const isPlanOnly = !completeness.hasBuilding && !completeness.hasPrice;

  // AI narrative — only generate if we have enough data (at least plan data)
  let narrative = "";
  let geminiStrengths: string[] = [];
  let geminiWeaknesses: string[] = [];
  let buyerSuitability: TSVReport["report"]["buyerSuitability"];

  if (apiKey && core.availableDimensionCount >= 2) {
    try {
      const provider = new TSVClaudeProvider(apiKey);
      const result = await provider.generateNarrative(input, core, building, value, composite);
      narrative = result.narrative;
      geminiStrengths = result.strengths;
      geminiWeaknesses = result.weaknesses;
      if (!isPlanOnly) {
        buyerSuitability = result.buyerSuitability;
      }
    } catch { /* non-fatal */ }
  }

  if (!narrative) {
    const planScore = `TSV plan score of ${core.total}/100`;
    const what = core.availableDimensionCount >= 3
      ? `Based on ${core.availableDimensionCount} scored dimensions from the floor plan.`
      : "Scored based on available data from the floor plan.";
    narrative =
      `${input.projectName ?? "This apartment"} has been evaluated with a ${planScore}. ${what} ` +
      (isPlanOnly
        ? "Add orientation, building details and asking price to unlock the full TSV report."
        : `Composite score: ${composite}/100.`);
  }

  const fallbackStrengths = deriveStrengths(core, building);
  const fallbackWeaknesses = deriveWeaknesses(core, building);

  const report: TSVReport = {
    id: randomUUID(),
    input: { ...input, floorPlanImage: undefined }, // strip image from stored report to save space
    completeness,
    scores: {
      core,
      building,
      value,
      composite,
      cityNormalized,
      isPlanOnly,
    },
    report: {
      strengths: geminiStrengths.length > 0 ? geminiStrengths : fallbackStrengths,
      weaknesses: geminiWeaknesses.length > 0 ? geminiWeaknesses : fallbackWeaknesses,
      planObservations,
      buyerSuitability,
      narrative,
      valueRating: value.available ? value.valueRating : undefined,
      verdictLabel,
      verdictColor,
    },
    ts: new Date().toISOString(),
  };

  saveTSVReport(report).catch(() => {});

  return NextResponse.json(report);
}
