import type { VastuDirection } from "./types";

interface VastuRule {
  idealDirections: VastuDirection[];
  acceptableDirections: VastuDirection[]; // allowed in moderate mode
  weight: number; // points out of 100
  label: string;
}

const VASTU_RULES: VastuRule[] = [
  {
    label: "Main Entrance",
    idealDirections: ["North", "NE", "East"],
    acceptableDirections: ["North", "NE", "East", "NW"],
    weight: 30,
  },
  {
    label: "Master Bedroom",
    idealDirections: ["SW", "South"],
    acceptableDirections: ["SW", "South", "West"],
    weight: 20,
  },
  {
    label: "Kitchen",
    idealDirections: ["SE", "East"],
    acceptableDirections: ["SE", "East", "NW"],
    weight: 20,
  },
  {
    label: "Toilets",
    idealDirections: ["NW", "West", "South"],
    acceptableDirections: ["NW", "West", "South", "SE"],
    weight: 15,
  },
  {
    label: "Pooja Room",
    idealDirections: ["NE", "East"],
    acceptableDirections: ["NE", "East", "North"],
    weight: 10,
  },
];

interface VastuInputs {
  entranceDirection: VastuDirection;
  kitchenDirection: VastuDirection;
  masterBedroomDirection: VastuDirection;
  toiletDirection: VastuDirection;
  poojaRoomDirection: VastuDirection;
}

function matchesIdeal(dir: VastuDirection, rule: VastuRule): boolean {
  return dir !== "unknown" && rule.idealDirections.includes(dir);
}

function matchesAcceptable(dir: VastuDirection, rule: VastuRule): boolean {
  return dir !== "unknown" && rule.acceptableDirections.includes(dir);
}

function getDirections(inputs: VastuInputs): VastuDirection[] {
  return [
    inputs.entranceDirection,
    inputs.masterBedroomDirection,
    inputs.kitchenDirection,
    inputs.toiletDirection,
    inputs.poojaRoomDirection,
  ];
}

// Strict: full points only if exactly ideal; else 0
export function scoreVastuStrict(inputs: VastuInputs): number {
  const dirs = getDirections(inputs);
  let total = 0;
  VASTU_RULES.forEach((rule, i) => {
    if (matchesIdeal(dirs[i], rule)) {
      total += rule.weight;
    }
  });
  return Math.round(total);
}

// Moderate: ideal = full, acceptable = 60%, not matching = 0
export function scoreVastuModerate(inputs: VastuInputs): number {
  const dirs = getDirections(inputs);
  let total = 0;
  VASTU_RULES.forEach((rule, i) => {
    const dir = dirs[i];
    if (dir === "unknown") {
      total += rule.weight * 0.5; // unknown = neutral
    } else if (matchesIdeal(dir, rule)) {
      total += rule.weight;
    } else if (matchesAcceptable(dir, rule)) {
      total += rule.weight * 0.6;
    }
  });
  return Math.round(total);
}

// Modern: only entrance (×2) and master bedroom (×2) scored; others ignored
export function scoreVastuModern(inputs: VastuInputs): number {
  const entranceRule = VASTU_RULES[0];
  const bedroomRule = VASTU_RULES[1];

  let total = 0;
  const entranceScore = matchesIdeal(inputs.entranceDirection, entranceRule)
    ? 100
    : matchesAcceptable(inputs.entranceDirection, entranceRule)
      ? 60
      : inputs.entranceDirection === "unknown"
        ? 50
        : 0;

  const bedroomScore = matchesIdeal(inputs.masterBedroomDirection, bedroomRule)
    ? 100
    : matchesAcceptable(inputs.masterBedroomDirection, bedroomRule)
      ? 60
      : inputs.masterBedroomDirection === "unknown"
        ? 50
        : 0;

  total = entranceScore * 0.6 + bedroomScore * 0.4;
  return Math.round(total);
}

export function getVastuDetail(inputs: VastuInputs): {
  strict: number;
  moderate: number;
  modern: number;
} {
  return {
    strict: scoreVastuStrict(inputs),
    moderate: scoreVastuModerate(inputs),
    modern: scoreVastuModern(inputs),
  };
}

export function getVastuAnalystNote(inputs: VastuInputs, moderate: number): string {
  const parts: string[] = [];
  const rules = VASTU_RULES;
  const dirs = getDirections(inputs);

  rules.forEach((rule, i) => {
    const dir = dirs[i];
    if (dir === "unknown") return;
    const ideal = matchesIdeal(dir, rule);
    const acceptable = matchesAcceptable(dir, rule);
    if (ideal) parts.push(`${rule.label} (${dir}) ✓`);
    else if (!acceptable) parts.push(`${rule.label} (${dir}) ✗`);
  });

  const summary = moderate >= 80 ? "Strong compliance." : moderate >= 60 ? "Moderate compliance." : "Several deviations from vastu norms.";
  return `${summary} ${parts.join(" · ")}`;
}
