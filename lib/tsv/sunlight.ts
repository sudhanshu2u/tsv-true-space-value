import type { CityKey, Facing } from "./types";

const ORIENTATION_BASE: Record<Facing, number> = {
  East: 95,
  NE: 90,
  SE: 88,
  South: 85,
  North: 65,
  NW: 70,
  West: 55,
  SW: 60,
};

function floorAdjustment(floor: number): number {
  if (floor >= 10) return 10;
  if (floor >= 5) return 0;
  if (floor >= 2) return -10;
  return -20; // ground floor
}

// Additional city-specific penalties/bonuses applied to the orientation base
function cityAdjustment(city: CityKey, facing: Facing): number {
  const hotCoastal: CityKey[] = ["mumbai", "chennai"];
  const cold: CityKey[] = ["delhi_ncr"];

  if (hotCoastal.includes(city) && facing === "West") return -15;
  if (cold.includes(city) && facing === "South") return 5;
  return 0;
}

export function scoreSunlight(
  facing: Facing,
  floorNumber: number,
  city: CityKey,
): { score: number; sunlightHoursPerDay: number; illuminationRating: "High" | "Medium" | "Low" } {
  const base = ORIENTATION_BASE[facing];
  const floorAdj = floorAdjustment(floorNumber);
  const cityAdj = cityAdjustment(city, facing);

  const score = Math.max(0, Math.min(100, base + floorAdj + cityAdj));

  // Simplified sunlight hours model
  const sunlightHoursPerDay =
    score >= 85 ? 6 : score >= 70 ? 4 : score >= 55 ? 2.5 : 1;

  const illuminationRating: "High" | "Medium" | "Low" =
    score >= 80 ? "High" : score >= 60 ? "Medium" : "Low";

  return { score, sunlightHoursPerDay, illuminationRating };
}

export function getSunlightAnalystNote(
  facing: Facing,
  floorNumber: number,
  city: CityKey,
): string {
  const { score, sunlightHoursPerDay, illuminationRating } = scoreSunlight(facing, floorNumber, city);
  const floorAdj = floorAdjustment(floorNumber);
  const cityAdj = cityAdjustment(city, facing);

  const parts = [
    `${facing}-facing — base ${ORIENTATION_BASE[facing]}/100.`,
    floorAdj !== 0 ? `Floor ${floorNumber} adjustment: ${floorAdj > 0 ? "+" : ""}${floorAdj}.` : "",
    cityAdj !== 0 ? `City adjustment (${city}): ${cityAdj > 0 ? "+" : ""}${cityAdj}.` : "",
    `Est. ${sunlightHoursPerDay}h direct sunlight/day. Natural illumination: ${illuminationRating}.`,
  ];

  return parts.filter(Boolean).join(" ");
}

export function getSunlightPlainEnglish(facing: Facing, illuminationRating: "High" | "Medium" | "Low"): string {
  if (illuminationRating === "High") {
    return `${facing}-facing with excellent natural light — expect bright mornings and lower electricity bills.`;
  }
  if (illuminationRating === "Medium") {
    return `${facing}-facing with decent daylight — some rooms may need artificial light during the day.`;
  }
  return `${facing}-facing with limited natural sunlight — expect higher lighting costs and potential dampness.`;
}
