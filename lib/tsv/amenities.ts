import type { AmenityKey } from "./types";

interface AmenityMeta {
  utilityScore: number; // 0–22, raw utility weight
  densityThreshold: number; // ideal max units-per-amenity
}

export const AMENITY_META: Record<AmenityKey, AmenityMeta> = {
  gym: { utilityScore: 22, densityThreshold: 200 },
  swimming_pool: { utilityScore: 18, densityThreshold: 300 },
  clubhouse: { utilityScore: 15, densityThreshold: 250 },
  childrens_play: { utilityScore: 12, densityThreshold: 150 },
  jogging_track: { utilityScore: 10, densityThreshold: 200 },
  sports_tt_badminton: { utilityScore: 8, densityThreshold: 200 },
  coworking: { utilityScore: 8, densityThreshold: 150 },
  senior_citizen_zone: { utilityScore: 6, densityThreshold: 200 },
  rooftop_garden: { utilityScore: 6, densityThreshold: 300 },
  spa_sauna: { utilityScore: 5, densityThreshold: 350 },
  amphitheatre: { utilityScore: 4, densityThreshold: 400 },
  library: { utilityScore: 4, densityThreshold: 250 },
  pet_zone: { utilityScore: 4, densityThreshold: 300 },
  business_centre: { utilityScore: 3, densityThreshold: 200 },
  concierge: { utilityScore: 3, densityThreshold: 500 },
};

const MAX_RAW_UTILITY = 100; // cap raw sum at 100

export function scoreAmenityUtility(amenities: AmenityKey[]): number {
  const raw = amenities.reduce((sum, key) => sum + (AMENITY_META[key]?.utilityScore ?? 0), 0);
  return Math.min(100, Math.round((raw / MAX_RAW_UTILITY) * 100));
}

export function scoreAmenityDensity(
  amenities: AmenityKey[],
  totalUnits: number,
): number {
  if (amenities.length === 0) return 0;
  const thresholds = amenities.map((k) => AMENITY_META[k]?.densityThreshold ?? 300);
  const avgThreshold = thresholds.reduce((a, b) => a + b, 0) / thresholds.length;
  // ratio: if actual units-per-amenity is at or below threshold → full score
  const unitsPerAmenity = totalUnits / amenities.length;
  return Math.min(100, Math.round((avgThreshold / unitsPerAmenity) * 100));
}

export function getAmenityPlainEnglish(amenities: AmenityKey[], utilityScore: number): string {
  const count = amenities.length;
  if (count === 0) return "No amenities listed — basic residential complex.";
  const quality = utilityScore >= 70 ? "high-quality" : utilityScore >= 45 ? "reasonable" : "limited";
  const highlights = amenities.slice(0, 2).map((k) => AMENITY_META[k] ? k.replace(/_/g, " ") : k);
  return `${count} amenities with ${quality} everyday utility — highlights include ${highlights.join(" and ")}.`;
}

export function getAmenityAnalystNote(
  amenities: AmenityKey[],
  totalUnits: number,
  utilityScore: number,
  densityScore: number,
): string {
  if (amenities.length === 0) return "No amenities declared.";
  const unitsPerAmenity = Math.round(totalUnits / amenities.length);
  return (
    `${amenities.length} amenities; utility score ${utilityScore}/100, density score ${densityScore}/100. ` +
    `Avg ${unitsPerAmenity} units per amenity. ` +
    (densityScore < 60
      ? "Density is too high — shared amenities may feel crowded."
      : "Density is within acceptable range.")
  );
}
