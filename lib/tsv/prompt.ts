import type { TSVInput, TSVCoreScore, TSVBuildingScore, TSVValueScore } from "./types";
import { CITY_LABELS } from "./types";

export function buildTSVNarrativePrompt(
  input: TSVInput,
  core: TSVCoreScore,
  building: TSVBuildingScore,
  value: TSVValueScore,
  composite: number,
): string {
  const city = input.city ? CITY_LABELS[input.city] : "Unknown City";
  return `You are a certified residential property analyst and urban planning specialist with 20 years of experience across Indian real estate markets.

You have just completed a True Space Value (TSV) analysis for the following apartment:

PROJECT: ${input.projectName ?? "Unknown"} by ${input.developerName ?? "Unknown"}
UNIT: ${input.unitType ?? "?"}, ${city} — ${input.locality ?? "?"}
CARPET AREA: ${input.carpetArea ?? "?"} sq ft | FLOOR: ${input.floorNumber ?? "?"}/${input.totalFloors ?? "?"}
FACING: ${input.facing ?? "not provided"} | VIEW: ${input.viewType?.replace(/_/g, " ") ?? "not provided"} | ASKING: ${input.askingPricePerSqFt ? `₹${input.askingPricePerSqFt.toLocaleString()}/sqft` : "not provided"}

TSV SCORES:
- TSV-Core (apartment quality): ${core.total}/100
  · Functional Space: ${core.functionalSpace.score}/100
  · Livability: ${core.livability.score}/100
  · Ventilation: ${core.ventilation.score}/100
  · Sunlight: ${core.sunlight.score}/100
  · View: ${core.view.score}/100
  · Vastu (moderate): ${core.vastu.moderate}/100

- TSV-Building (infrastructure): ${building.total}/100
  · Parking: ${building.parking.score}/100
  · Elevators: ${building.elevators.score}/100
  · Fire Safety: ${building.fireSafety.score}/100
  · Water & Power: ${building.waterAndPower.score}/100
  · Security: ${building.security.score}/100
  · Amenities: ${building.amenityUtility.score}/100

- TSV-Value (price-adjusted): ${value.total}/100
  · Asking ${input.askingPricePerSqFt ? `₹${input.askingPricePerSqFt.toLocaleString()}` : "N/A"} vs benchmark ₹${value.cityBenchmarkPrice.toLocaleString()} (${value.pricePremiumPercent > 0 ? "+" : ""}${value.pricePremiumPercent}%)
  · Value Rating: ${value.valueRating}

COMPOSITE TSV SCORE: ${composite}/100

Generate a JSON object with the following fields:

{
  "narrative": "3–4 paragraph analyst-grade report. Paragraph 1: overview of the unit's strengths. Paragraph 2: key weaknesses and what buyers should negotiate or verify. Paragraph 3: market positioning and who this apartment is best suited for. Paragraph 4 (optional): investment outlook. Write in precise, professional but accessible English. No bullet points — flowing prose only.",
  "strengths": ["up to 4 concise strength statements, each under 15 words"],
  "weaknesses": ["up to 4 concise weakness statements, each under 15 words"],
  "buyerSuitability": {
    "endUser": { "rating": "Excellent|Good|Fair|Poor", "reason": "one sentence" },
    "investor": { "rating": "Excellent|Good|Fair|Poor", "reason": "one sentence" },
    "nri": { "rating": "Excellent|Good|Fair|Poor", "reason": "one sentence" }
  },
  "investmentOutlook": "one paragraph on 5-year resale potential based on view permanence, location, and score"
}

Be specific to this apartment's actual numbers. Do not use generic real-estate language.`;
}

export function buildFloorPlanAnalysisPrompt(): string {
  return `You are an expert architectural analyst. Analyze this residential floor plan image and extract the following data as JSON:

{
  "bedrooms": <number>,
  "bathrooms": <number>,
  "estimatedCarpetAreaSqFt": <number — estimate based on visual scale and room proportions>,
  "passageAreaPercent": <number 0-100 — estimate % of total area consumed by passages, corridors, lobby>,
  "roomsRectangular": <boolean — are the majority of habitable rooms roughly rectangular?>,
  "dryBalconyPresent": <boolean>,
  "storagePresent": <boolean — visible storage room, loft, or utility area>,
  "kitchenShape": "straight|L_shape|U_shape|island|galley",
  "externalWindowsCount": <number — count of windows/openings on external walls>,
  "crossVentilation": "opposite_walls|adjacent_walls|single_sided",
  "notes": "<any unusual features, dead corners, awkward polygonal rooms, oversized lobbies>"
}

Be precise. If you cannot determine a value from the image, use your best estimate and note the uncertainty in the notes field.`;
}
