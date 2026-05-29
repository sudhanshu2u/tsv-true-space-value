import type {
  TSVInput,
  TSVCoreScore,
  TSVBuildingScore,
  TSVValueScore,
  DimensionScore,
  DataCompleteness,
  CityKey,
} from "./types";
import { getCityBenchmark } from "./city-benchmarks";
import { scoreSunlight, getSunlightAnalystNote, getSunlightPlainEnglish } from "./sunlight";
import { getVastuDetail, getVastuAnalystNote } from "./vastu";
import {
  scoreAmenityUtility,
  scoreAmenityDensity,
  getAmenityPlainEnglish,
  getAmenityAnalystNote,
} from "./amenities";

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

function unavailable(label: string, missingReason: string): DimensionScore {
  return {
    available: false,
    score: 0,
    label,
    plainEnglish: "Score not available — data not provided.",
    analystNote: missingReason,
    missingReason,
  };
}

// ────────────────────────────────────────────────────────────────
// Data completeness
// ────────────────────────────────────────────────────────────────

export function computeCompleteness(input: TSVInput): DataCompleteness {
  const hasPlan = !!(input.floorPlanImage || input.carpetArea);
  const hasOrientation = !!(input.facing);
  const hasView = !!(input.viewType);
  const hasVastu = !!(input.entranceDirection);
  const hasBuilding = !!(input.parkingType);
  const hasPrice = !!(input.askingPricePerSqFt && input.askingPricePerSqFt > 0);
  const hasCity = !!(input.city);

  // Weight each section
  const score =
    (hasPlan ? 30 : 0) +
    (hasOrientation ? 10 : 0) +
    (hasView ? 10 : 0) +
    (hasVastu ? 10 : 0) +
    (hasBuilding ? 25 : 0) +
    (hasPrice ? 10 : 0) +
    (hasCity ? 5 : 0);

  return { hasPlan, hasOrientation, hasView, hasVastu, hasBuilding, hasPrice, hasCity, completenessPercent: score };
}

// ────────────────────────────────────────────────────────────────
// TSV-Core dimensions
// ────────────────────────────────────────────────────────────────

function scoreFunctionalSpace(input: TSVInput): DimensionScore {
  const area = input.carpetArea;
  if (!area || area <= 0) {
    return unavailable("Functional Space", "Upload a floor plan or enter carpet area to score this dimension.");
  }

  // Use city median if available, else national average
  let medianArea = 900; // national 2BHK average
  if (input.city && input.unitType) {
    try {
      medianArea = getCityBenchmark(input.city).carpetAreaMedian[input.unitType];
    } catch { /* use default */ }
  }

  const areaRatio = area / medianArea;
  let base = clamp(areaRatio * 70, 0, 85);

  const passage = input.passageAreaPercent ?? 12;
  if (passage > 20) base -= 15;
  else if (passage > 15) base -= 10;

  if (input.roomsRectangular) base += 8;
  if (input.dryBalconyPresent) base += 4;
  if (input.storagePresent) base += 4;

  const cityBenchmark = input.city ? getCityBenchmark(input.city) : null;
  if (cityBenchmark) {
    if (input.kitchenArea && input.kitchenArea >= cityBenchmark.norms.minKitchenAreaSqFt) base += 5;
    else if (input.kitchenArea) base -= 8;
    if (cityBenchmark.norms.dryBalconyExpected && !input.dryBalconyPresent) base -= 5;
  }

  const score = clamp(base);
  const sba = input.superBuiltupArea ?? area * 1.35;
  const nur = Math.round((area / sba) * 100) / 100;

  return {
    available: true,
    score,
    label: "Functional Space",
    plainEnglish:
      score >= 80
        ? "Excellent use of space — very little area is wasted on corridors."
        : score >= 65
          ? "Reasonably efficient layout with acceptable passage area."
          : "Significant portion of area is wasted on passages or dead corners.",
    analystNote:
      `Carpet ${area} sqft | median ${medianArea} sqft. NUR: ${nur}. ` +
      `Passage: ${passage}%. Rectangular rooms: ${input.roomsRectangular ? "yes" : "no"}.`,
  };
}

function scoreLivability(input: TSVInput): DimensionScore {
  const bedrooms = input.bedrooms;
  if (!bedrooms) {
    return unavailable("Livability", "Upload a floor plan or enter bedroom count to score this dimension.");
  }

  let score = 60;
  const ceiling = input.ceilingHeight ?? 9; // assume standard 9ft if not provided
  if (ceiling >= 10) score += 20;
  else if (ceiling >= 9) score += 10;
  else if (ceiling < 8.5) score -= 10;

  const area = input.carpetArea ?? 0;
  if (area > 0) {
    const sqftPerBedroom = area / Math.max(1, bedrooms);
    if (sqftPerBedroom >= 200) score += 10;
    else if (sqftPerBedroom < 130) score -= 10;
  }

  const bathRatio = (input.bathrooms ?? 1) / bedrooms;
  if (bathRatio >= 1) score += 5;
  else score -= 5;

  if (input.storagePresent) score += 5;
  if ((input.balconyArea ?? 0) >= 50) score += 5;
  else if (input.balconyArea === 0) score -= 5;

  const finalScore = clamp(score);
  const assumedCeiling = !input.ceilingHeight;

  return {
    available: true,
    score: finalScore,
    label: "Livability",
    plainEnglish:
      finalScore >= 80
        ? "Generous room proportions and adequate amenities make this a comfortable everyday home."
        : finalScore >= 65
          ? "Adequate room sizes for comfortable day-to-day living."
          : "Compact rooms may impact daily comfort — check bedroom dimensions carefully.",
    analystNote:
      `Bedrooms: ${bedrooms}. Ceiling: ${ceiling}ft${assumedCeiling ? " (assumed standard)" : ""}. ` +
      `Bath/bed ratio: ${bathRatio.toFixed(2)}. Balcony: ${input.balconyArea ?? "not specified"} sqft.`,
  };
}

function scoreVentilation(input: TSVInput): DimensionScore {
  const windows = input.externalWindowsCount;
  const crossVent = input.crossVentilation;

  if (windows === undefined && !crossVent) {
    return unavailable("Ventilation", "Upload a floor plan to detect windows and ventilation pattern.");
  }

  const cvMap: Record<string, number> = {
    opposite_walls: 100,
    adjacent_walls: 60,
    single_sided: 30,
  };

  const bedrooms = input.bedrooms ?? 2;
  const w = windows ?? 4;
  const externalScore = clamp((w / Math.max(1, bedrooms)) * 50);
  const crossScore = crossVent ? cvMap[crossVent] ?? 60 : 60;
  const floor = input.floorNumber ?? 5;
  const stackScore = floor > 6 ? 70 : floor >= 3 ? 40 : 20;

  const area = input.carpetArea ?? 900;
  const estimatedWindowArea = w * 16;
  const windowRatio = (estimatedWindowArea / Math.max(1, area)) * 100;
  const windowRatioScore = clamp(windowRatio >= 12 ? 100 : (windowRatio / 12) * 100);

  const composite = externalScore * 0.35 + windowRatioScore * 0.30 + crossScore * 0.25 + stackScore * 0.10;
  const score = clamp(composite);

  const cvLabel =
    crossVent === "opposite_walls" ? "Full cross-ventilation"
    : crossVent === "adjacent_walls" ? "Partial cross-ventilation"
    : "Single-sided only";

  return {
    available: true,
    score,
    label: "Ventilation",
    plainEnglish:
      score >= 80
        ? "Excellent airflow — this apartment can stay comfortable with windows alone."
        : score >= 60
          ? "Adequate ventilation — some AC dependency expected."
          : "Poor ventilation — expect significant AC use and potential humidity issues.",
    analystNote:
      `${w} external windows. ${cvLabel}. Est. window/floor ratio: ${windowRatio.toFixed(1)}% (ideal 12–15%).`,
  };
}

function scoreSunlightDimension(input: TSVInput): DimensionScore {
  if (!input.facing) {
    return unavailable("Sunlight Quality", "Add the apartment's facing direction (orientation) to unlock this score.");
  }

  const city = input.city ?? "bangalore";
  const floor = input.floorNumber ?? 5;
  const { score, illuminationRating } = scoreSunlight(input.facing, floor, city);

  return {
    available: true,
    score,
    label: "Sunlight Quality",
    plainEnglish: getSunlightPlainEnglish(input.facing, illuminationRating),
    analystNote: getSunlightAnalystNote(input.facing, floor, city),
  };
}

function scoreViewDimension(input: TSVInput): DimensionScore {
  if (!input.viewType) {
    return unavailable("View Quality", "Add view type (sea, park, open, etc.) to unlock this score.");
  }

  const VIEW_BASE: Record<string, number> = {
    sea_river_lake: 95, golf_course: 90, city_skyline: 85,
    park_garden: 80, open_land: 65, internal_courtyard: 45, road_obstructed: 25,
  };
  const VIEW_PERMANENCE: Record<string, number> = {
    sea_river_lake: 0.95, golf_course: 0.90, city_skyline: 0.80,
    park_garden: 0.85, open_land: 0.60, internal_courtyard: 0.90, road_obstructed: 0.95,
  };
  const VIEW_ANGLE_FACTOR: Record<string, number> = {
    wide_180plus: 1.0, medium_90_180: 0.85, narrow_45_90: 0.70, slot_under_45: 0.55,
  };

  const base = VIEW_BASE[input.viewType] ?? 50;
  const permanence = VIEW_PERMANENCE[input.viewType] ?? 0.80;
  const angleFactor = input.viewAngle ? VIEW_ANGLE_FACTOR[input.viewAngle] ?? 0.85 : 0.85;
  const score = clamp(base * permanence * angleFactor);

  const viewLabel = input.viewType.replace(/_/g, " ");

  return {
    available: true,
    score,
    label: "View Quality",
    plainEnglish:
      score >= 80
        ? `Exceptional ${viewLabel} — a long-term asset that is hard to replicate.`
        : score >= 55
          ? `Decent ${viewLabel} with reasonable permanence.`
          : "Limited or obstructed view — unlikely to command a resale premium.",
    analystNote:
      `View: ${viewLabel}. Base ${base} × permanence ${permanence} × angle ${angleFactor} = ${score}.`,
  };
}

function scoreVastuDimension(input: TSVInput): TSVCoreScore["vastu"] {
  const hasAnyVastu = !!(input.entranceDirection || input.kitchenDirection || input.masterBedroomDirection);

  if (!hasAnyVastu) {
    const na = unavailable("Vastu Compliance", "Add entrance, kitchen and bedroom directions to unlock vastu scoring.");
    return { strict: 0, moderate: 0, modern: 0, score: na };
  }

  const vastuInputs = {
    entranceDirection: input.entranceDirection ?? "unknown",
    kitchenDirection: input.kitchenDirection ?? "unknown",
    masterBedroomDirection: input.masterBedroomDirection ?? "unknown",
    toiletDirection: input.toiletDirection ?? "unknown",
    poojaRoomDirection: input.poojaRoomDirection ?? "unknown",
  };

  const { strict, moderate, modern } = getVastuDetail(vastuInputs);
  const analystNote = getVastuAnalystNote(vastuInputs, moderate);

  return {
    strict, moderate, modern,
    score: {
      available: true,
      score: moderate,
      label: "Vastu Compliance",
      plainEnglish:
        moderate >= 80
          ? "Strong vastu compliance — entrance, master bedroom and kitchen all aligned correctly."
          : moderate >= 60
            ? "Moderate vastu compliance with some acceptable deviations."
            : "Several vastu deviations — buyers who prioritize vastu may want to consult an expert.",
      analystNote,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// TSV-Core composite (from available dimensions only)
// ────────────────────────────────────────────────────────────────

export function computeTSVCore(input: TSVInput): TSVCoreScore {
  const functionalSpace = scoreFunctionalSpace(input);
  const livability = scoreLivability(input);
  const ventilation = scoreVentilation(input);
  const sunlight = scoreSunlightDimension(input);
  const view = scoreViewDimension(input);
  const vastu = scoreVastuDimension(input);

  const dims = [
    { dim: functionalSpace, weight: 0.30 },
    { dim: livability, weight: 0.20 },
    { dim: ventilation, weight: 0.15 },
    { dim: sunlight, weight: 0.15 },
    { dim: view, weight: 0.10 },
    { dim: vastu.score, weight: 0.10 },
  ];

  // Compute weighted average of available dimensions only, then re-normalise weights
  const availableDims = dims.filter((d) => d.dim.available);
  const totalWeight = availableDims.reduce((s, d) => s + d.weight, 0);
  const total = totalWeight > 0
    ? clamp(availableDims.reduce((s, d) => s + d.dim.score * (d.weight / totalWeight), 0))
    : 0;

  return {
    total,
    availableDimensionCount: availableDims.length,
    functionalSpace,
    livability,
    ventilation,
    sunlight,
    view,
    vastu,
  };
}

// ────────────────────────────────────────────────────────────────
// TSV-Building
// ────────────────────────────────────────────────────────────────

export function computeTSVBuilding(input: TSVInput): TSVBuildingScore {
  const hasBuildingData = !!(input.parkingType || input.powerBackup || input.amenities?.length);

  if (!hasBuildingData) {
    const na = (label: string, reason: string) => unavailable(label, reason);
    return {
      total: 0,
      available: false,
      parking: na("Parking", "Add building details to unlock."),
      elevators: na("Elevators", "Add building details to unlock."),
      fireSafety: na("Fire & Safety", "Add building details to unlock."),
      waterAndPower: na("Water & Power", "Add building details to unlock."),
      security: na("Security", "Add building details to unlock."),
      amenityUtility: na("Amenities", "Add building details to unlock."),
    };
  }

  // Parking
  const PARKING_SCORE: Record<string, number> = {
    dedicated_covered: 100, mechanical_stack: 80, dedicated_open: 70, visitor_only: 20,
  };
  let parkingRaw = input.parkingType ? PARKING_SCORE[input.parkingType] ?? 70 : 70;
  if (input.evReady) parkingRaw = clamp(parkingRaw + 10);
  const parking: DimensionScore = {
    available: !!input.parkingType,
    score: parkingRaw,
    label: "Parking",
    plainEnglish: parkingRaw >= 80 ? "Dedicated covered parking — your slot is secure." : "Parking available but not covered or dedicated.",
    analystNote: `${input.parkingType?.replace(/_/g, " ") ?? "not specified"}${input.evReady ? " + EV" : ""}.`,
  };

  // Elevators
  const units = input.totalUnitsInProject ?? 200;
  const lifts = input.liftCount ?? 0;
  const required = Math.ceil(units / 100);
  const elevatorScore = lifts > 0 ? clamp((lifts / required) * 100) : 0;
  const elevators: DimensionScore = {
    available: lifts > 0,
    score: elevatorScore,
    label: "Elevators",
    plainEnglish: elevatorScore >= 80 ? `${lifts} lifts — minimal wait times expected.` : "Lift capacity may be insufficient at peak hours.",
    analystNote: `${lifts} lifts / ${required} required for ${units} units.`,
    missingReason: lifts === 0 ? "Add lift count to unlock." : undefined,
  };

  // Fire safety
  const fs = input.fireSafetyFeatures ?? [];
  const fireSafetyScore = clamp((fs.length / 8) * 100);
  const fireSafety: DimensionScore = {
    available: fs.length > 0,
    score: fireSafetyScore,
    label: "Fire & Safety",
    plainEnglish: fireSafetyScore >= 80 ? "Comprehensive fire safety systems in place." : fs.length > 0 ? "Basic fire safety — check if refuge areas are present." : "Fire safety data not provided.",
    analystNote: fs.length > 0 ? `${fs.length}/8 features: ${fs.join(", ")}.` : "Not provided.",
    missingReason: fs.length === 0 ? "Add fire safety features to unlock." : undefined,
  };

  // Water & power
  const powerScores: Record<string, number> = { full: 100, partial: 60, none: 0 };
  const waterScores: Record<string, number> = { "24x7_borewell": 100, municipal_tank: 70, irregular: 30 };
  const hasWP = !!(input.powerBackup || input.waterSupply);
  const p = input.powerBackup ? powerScores[input.powerBackup] ?? 50 : 50;
  const w = input.waterSupply ? waterScores[input.waterSupply] ?? 50 : 50;
  const wpScore = hasWP ? clamp(w * 0.60 + p * 0.40) : 0;
  const waterAndPower: DimensionScore = {
    available: hasWP,
    score: wpScore,
    label: "Water & Power",
    plainEnglish: hasWP ? (wpScore >= 80 ? "Reliable 24×7 water and full power backup." : "Adequate utilities with some supply dependency.") : "Not provided.",
    analystNote: hasWP ? `Water: ${input.waterSupply ?? "?"}. Power: ${input.powerBackup ?? "?"}.` : "Not provided.",
    missingReason: !hasWP ? "Add water supply and power backup details." : undefined,
  };

  // Security
  const sec = input.securityFeatures ?? [];
  const secScore = clamp(Math.min(4, sec.length) * 25);
  const security: DimensionScore = {
    available: sec.length > 0,
    score: secScore,
    label: "Security",
    plainEnglish: sec.length > 0 ? (secScore >= 75 ? "Multi-layer security system in place." : "Basic security measures.") : "Not provided.",
    analystNote: sec.length > 0 ? sec.join(", ") : "Not provided.",
    missingReason: sec.length === 0 ? "Add security features to unlock." : undefined,
  };

  // Amenities
  const ams = input.amenities ?? [];
  const utilityScore = scoreAmenityUtility(ams);
  const densityScore = scoreAmenityDensity(ams, units);
  const accessScore = input.amenitiesOnSameLevel ? 100 : 70;
  const amenityComposite = ams.length > 0 ? clamp(utilityScore * 0.55 + densityScore * 0.30 + accessScore * 0.15) : 0;
  const amenityUtility: DimensionScore = {
    available: ams.length > 0,
    score: amenityComposite,
    label: "Amenities",
    plainEnglish: ams.length > 0 ? getAmenityPlainEnglish(ams, utilityScore) : "Amenity list not provided.",
    analystNote: ams.length > 0 ? getAmenityAnalystNote(ams, units, utilityScore, densityScore) : "Not provided.",
    missingReason: ams.length === 0 ? "Add amenities list to unlock." : undefined,
  };

  const availableDims = [parking, elevators, fireSafety, waterAndPower, security, amenityUtility].filter((d) => d.available);
  const weights = [0.20, 0.15, 0.15, 0.15, 0.10, 0.25];
  const dims = [parking, elevators, fireSafety, waterAndPower, security, amenityUtility];
  const totalWeight = dims.reduce((s, d, i) => s + (d.available ? weights[i] : 0), 0);
  const total = totalWeight > 0
    ? clamp(dims.reduce((s, d, i) => s + (d.available ? d.score * (weights[i] / totalWeight) : 0), 0))
    : 0;

  return { total, available: availableDims.length > 0, parking, elevators, fireSafety, waterAndPower, security, amenityUtility };
}

// ────────────────────────────────────────────────────────────────
// TSV-Value
// ────────────────────────────────────────────────────────────────

export function computeTSVValue(input: TSVInput, coreScore: number): TSVValueScore {
  if (!input.askingPricePerSqFt || input.askingPricePerSqFt <= 0) {
    return {
      total: 0, available: false, pricePerSqFt: 0, cityBenchmarkPrice: 0,
      pricePremiumPercent: 0, priceCompetitivenessScore: 0,
      valueRating: "Fair Value",
    };
  }

  const city = input.city ?? "bangalore";
  const benchmark = getCityBenchmark(city);
  const price = input.askingPricePerSqFt;

  // Determine segment
  const b = benchmark.pricePerSqFt;
  const segment: keyof typeof b =
    price <= b.affordable ? "affordable" : price <= b.mid ? "mid" : price <= b.premium ? "premium" : "luxury";
  const benchmarkPrice = b[segment];

  const pricePremiumPercent = Math.round(((price - benchmarkPrice) / benchmarkPrice) * 1000) / 10;
  const priceCompetitivenessScore = clamp(100 * (benchmarkPrice / price));
  const total = clamp(coreScore * 0.70 + priceCompetitivenessScore * 0.30);

  const valueRating: "Undervalued" | "Fair Value" | "Overpriced" =
    total >= 80 && coreScore >= 75 ? "Undervalued" : total >= 60 ? "Fair Value" : "Overpriced";

  return { total, available: true, pricePerSqFt: price, cityBenchmarkPrice: benchmarkPrice, pricePremiumPercent, priceCompetitivenessScore, valueRating };
}

// ────────────────────────────────────────────────────────────────
// Composite + Verdict
// ────────────────────────────────────────────────────────────────

export function computeComposite(core: TSVCoreScore, building: TSVBuildingScore, value: TSVValueScore): number {
  // Only include available layers in composite; re-weight accordingly
  const layers: { score: number; weight: number; avail: boolean }[] = [
    { score: core.total, weight: 0.50, avail: core.availableDimensionCount > 0 },
    { score: building.total, weight: 0.30, avail: building.available },
    { score: value.total, weight: 0.20, avail: value.available },
  ];
  const totalWeight = layers.reduce((s, l) => s + (l.avail ? l.weight : 0), 0);
  if (totalWeight === 0) return 0;
  return clamp(layers.reduce((s, l) => s + (l.avail ? l.score * (l.weight / totalWeight) : 0), 0));
}

export function computeCityNormalized(composite: number, city: string, unitType: string): number {
  const benchmark = getCityBenchmark(city as CityKey);
  const coeff = (benchmark.correctionCoefficient as Record<string, number>)[unitType] ?? 1.0;
  return clamp(composite * coeff);
}

export function getVerdictLabel(composite: number): {
  label: "Excellent" | "Great Buy" | "Good" | "Fair" | "Caution" | "Avoid";
  color: "green" | "blue" | "amber" | "orange" | "red";
} {
  if (composite >= 85) return { label: "Excellent", color: "green" };
  if (composite >= 75) return { label: "Great Buy", color: "green" };
  if (composite >= 65) return { label: "Good", color: "blue" };
  if (composite >= 55) return { label: "Fair", color: "amber" };
  if (composite >= 40) return { label: "Caution", color: "orange" };
  return { label: "Avoid", color: "red" };
}

export function deriveStrengths(core: TSVCoreScore, building: TSVBuildingScore): string[] {
  const dims = [
    { label: "Space efficiency", score: core.functionalSpace.score, avail: core.functionalSpace.available },
    { label: "Natural ventilation", score: core.ventilation.score, avail: core.ventilation.available },
    { label: "Natural light", score: core.sunlight.score, avail: core.sunlight.available },
    { label: "View quality", score: core.view.score, avail: core.view.available },
    { label: "Livability", score: core.livability.score, avail: core.livability.available },
    { label: "Vastu compliance", score: core.vastu.moderate, avail: core.vastu.score.available },
    { label: "Parking quality", score: building.parking.score, avail: building.parking.available },
    { label: "Amenity value", score: building.amenityUtility.score, avail: building.amenityUtility.available },
    { label: "Water & power backup", score: building.waterAndPower.score, avail: building.waterAndPower.available },
    { label: "Fire safety", score: building.fireSafety.score, avail: building.fireSafety.available },
  ];
  return dims.filter((d) => d.avail && d.score >= 80).sort((a, b) => b.score - a.score).slice(0, 4).map((d) => `${d.label}: ${d.score}/100`);
}

export function deriveWeaknesses(core: TSVCoreScore, building: TSVBuildingScore): string[] {
  const dims = [
    { label: "Space efficiency", score: core.functionalSpace.score, avail: core.functionalSpace.available, note: core.functionalSpace.analystNote },
    { label: "Ventilation", score: core.ventilation.score, avail: core.ventilation.available, note: core.ventilation.analystNote },
    { label: "Natural light", score: core.sunlight.score, avail: core.sunlight.available, note: core.sunlight.analystNote },
    { label: "View", score: core.view.score, avail: core.view.available, note: core.view.analystNote },
    { label: "Livability", score: core.livability.score, avail: core.livability.available, note: core.livability.analystNote },
    { label: "Vastu", score: core.vastu.moderate, avail: core.vastu.score.available, note: core.vastu.score.analystNote },
    { label: "Parking", score: building.parking.score, avail: building.parking.available, note: building.parking.analystNote },
    { label: "Amenities", score: building.amenityUtility.score, avail: building.amenityUtility.available, note: building.amenityUtility.analystNote },
    { label: "Water & power", score: building.waterAndPower.score, avail: building.waterAndPower.available, note: building.waterAndPower.analystNote },
    { label: "Fire safety", score: building.fireSafety.score, avail: building.fireSafety.available, note: building.fireSafety.analystNote },
  ];
  return dims
    .filter((d) => d.avail && d.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((d) => `${d.label} (${d.score}/100) — ${d.note.split(".")[0]}.`);
}
