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
  return `You are an expert architectural analyst specialising in Indian residential floor plans. Analyse this floor plan image carefully.

CRITICAL READING PRIORITY — check for these in order:
1. If a RERA / area statement table is printed on the plan, read the exact RERA Carpet Area in sq.ft from it — use that as estimatedCarpetAreaSqFt, NOT a visual guess.
2. If a room schedule / area table is printed (listing room names with sq.ft or sq.m sizes), calculate passageAreaPercent as: (passage/corridor row area ÷ RERA carpet area) × 100.
3. Read the key plan compass (N arrow) to extract the primary facing direction.
4. Read the plan header for unit identifier (Wing, Flat number, floor range).
5. Only estimate visually if no printed table is present.

Extract the following fields:

- bedrooms: count of bedroom rooms (not toilets, not study)
- bathrooms: count of attached toilets (NOT powder/guest toilet)
- estimatedCarpetAreaSqFt: RERA carpet area from table if visible, otherwise visual estimate
- passageAreaPercent: passage + corridor as % of carpet area (0–100); calculate from table if available
- roomsRectangular: true if most habitable rooms are roughly rectangular
- dryBalconyPresent: true if utility/dry balcony/service area present
- storagePresent: true if dedicated storage room, loft, or large utility present
- kitchenShape: straight / L_shape / U_shape / island / galley
- externalWindowsCount: count of window or ventilation openings on external walls
- crossVentilation: opposite_walls (windows on facing walls) / adjacent_walls / single_sided
- notes: include — (a) exact RERA carpet area and breakdown if table present; (b) individual room dimensions from schedule if printed; (c) facing direction from key plan compass; (d) unit identifier from header; (e) any dead corners, irregular shapes, or oversized passages
- facingFromPlan: primary facing direction read from key plan compass — "North", "South", "East", "West", "NE", "NW", "SE", or "SW". Omit if compass not legible.
- projectIdentifier: unit identifier from plan header (e.g. "Wing A Flat 01, 9th–33rd Floor"). Omit if not visible.

Be precise. Prefer numbers from printed tables over visual estimates. Record all room dimensions you can read in the notes field.`;
}
