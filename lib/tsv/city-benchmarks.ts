import type { CityKey, UnitType } from "./types";

export interface CityBenchmark {
  label: string;
  correctionCoefficient: Record<UnitType, number>;
  carpetAreaMedian: Record<UnitType, number>; // sq ft
  pricePerSqFt: {
    affordable: number;
    mid: number;
    premium: number;
    luxury: number;
  };
  // City-specific norms that affect scoring
  norms: {
    dryBalconyExpected: boolean;
    poojaRoomExpected: boolean;
    minKitchenAreaSqFt: number;
    westFacingPenalty: number; // extra penalty on sunlight score
    southFacingBonus: number;  // cold climate bonus
  };
  tips: string; // shown on city hub page
}

export const CITY_BENCHMARKS: Record<CityKey, CityBenchmark> = {
  mumbai: {
    label: "Mumbai",
    correctionCoefficient: {
      Studio: 1.40,
      "1BHK": 1.35,
      "2BHK": 1.30,
      "3BHK": 1.25,
      "4BHK": 1.15,
      Penthouse: 1.05,
    },
    carpetAreaMedian: {
      Studio: 300,
      "1BHK": 450,
      "2BHK": 700,
      "3BHK": 1000,
      "4BHK": 1400,
      Penthouse: 2500,
    },
    pricePerSqFt: {
      affordable: 12000,
      mid: 22000,
      premium: 40000,
      luxury: 80000,
    },
    norms: {
      dryBalconyExpected: true,
      poojaRoomExpected: false,
      minKitchenAreaSqFt: 55,
      westFacingPenalty: 15,
      southFacingBonus: 0,
    },
    tips:
      "In Mumbai, dry balconies are mandatory — their absence signals a design compromise. West-facing units suffer from monsoon driving rain and harsh afternoon heat. Carpet area is king here; always cross-check the loading factor (SBA/carpet ratio).",
  },

  delhi_ncr: {
    label: "Delhi NCR",
    correctionCoefficient: {
      Studio: 0.95,
      "1BHK": 0.95,
      "2BHK": 0.95,
      "3BHK": 0.95,
      "4BHK": 0.95,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 450,
      "1BHK": 650,
      "2BHK": 1050,
      "3BHK": 1500,
      "4BHK": 2000,
      Penthouse: 3500,
    },
    pricePerSqFt: {
      affordable: 6000,
      mid: 11000,
      premium: 20000,
      luxury: 45000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 70,
      westFacingPenalty: 5,
      southFacingBonus: 5,
    },
    tips:
      "Delhi NCR buyers expect larger rooms — a 2BHK under 900 sq ft carpet is considered cramped. South-facing units get warm winter sun, which is a genuine benefit in the cold months. Pooja rooms are a strong expectation in this market.",
  },

  bangalore: {
    label: "Bangalore",
    correctionCoefficient: {
      Studio: 1.00,
      "1BHK": 1.00,
      "2BHK": 1.00,
      "3BHK": 1.00,
      "4BHK": 1.00,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 380,
      "1BHK": 580,
      "2BHK": 900,
      "3BHK": 1300,
      "4BHK": 1800,
      Penthouse: 3000,
    },
    pricePerSqFt: {
      affordable: 5500,
      mid: 9500,
      premium: 18000,
      luxury: 35000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: false,
      minKitchenAreaSqFt: 60,
      westFacingPenalty: 8,
      southFacingBonus: 0,
    },
    tips:
      "Bangalore's mild climate means ventilation matters more than in other cities — cross-ventilation can replace AC entirely. East and NE-facing units command a natural premium. Tech-worker demand for co-working spaces makes that amenity unusually valuable here.",
  },

  pune: {
    label: "Pune",
    correctionCoefficient: {
      Studio: 1.00,
      "1BHK": 1.00,
      "2BHK": 1.00,
      "3BHK": 1.00,
      "4BHK": 1.00,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 380,
      "1BHK": 600,
      "2BHK": 950,
      "3BHK": 1350,
      "4BHK": 1900,
      Penthouse: 3000,
    },
    pricePerSqFt: {
      affordable: 5000,
      mid: 8500,
      premium: 15000,
      luxury: 28000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 65,
      westFacingPenalty: 8,
      southFacingBonus: 0,
    },
    tips:
      "Pune has excellent natural climate — apartments with good cross-ventilation and east-facing living rooms are ideal year-round. Hill-view units near Baner/Pashan command a permanent view premium.",
  },

  hyderabad: {
    label: "Hyderabad",
    correctionCoefficient: {
      Studio: 0.95,
      "1BHK": 0.95,
      "2BHK": 0.95,
      "3BHK": 0.95,
      "4BHK": 0.95,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 420,
      "1BHK": 650,
      "2BHK": 1050,
      "3BHK": 1500,
      "4BHK": 2000,
      Penthouse: 3500,
    },
    pricePerSqFt: {
      affordable: 4500,
      mid: 7500,
      premium: 14000,
      luxury: 25000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 65,
      westFacingPenalty: 10,
      southFacingBonus: 0,
    },
    tips:
      "Hyderabad offers the best value-for-space ratio among Tier-1 cities. Large apartments are the norm — a 2BHK under 950 sq ft is considered small. Lake-facing units (Hussain Sagar, Durgam Cheruvu) carry strong permanent view premiums.",
  },

  chennai: {
    label: "Chennai",
    correctionCoefficient: {
      Studio: 1.00,
      "1BHK": 1.00,
      "2BHK": 1.00,
      "3BHK": 1.00,
      "4BHK": 1.00,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 380,
      "1BHK": 580,
      "2BHK": 900,
      "3BHK": 1300,
      "4BHK": 1800,
      Penthouse: 3000,
    },
    pricePerSqFt: {
      affordable: 5000,
      mid: 8000,
      premium: 15000,
      luxury: 28000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 60,
      westFacingPenalty: 12,
      southFacingBonus: 0,
    },
    tips:
      "Chennai's coastal humidity makes ventilation critical — single-sided units can become uncomfortably damp. Sea-facing units command strong premiums in ECR/Besant Nagar corridors. Avoid west-facing units — afternoon heat is intense year-round.",
  },

  ahmedabad: {
    label: "Ahmedabad",
    correctionCoefficient: {
      Studio: 0.90,
      "1BHK": 0.90,
      "2BHK": 0.90,
      "3BHK": 0.90,
      "4BHK": 0.90,
      Penthouse: 0.95,
    },
    carpetAreaMedian: {
      Studio: 450,
      "1BHK": 700,
      "2BHK": 1100,
      "3BHK": 1600,
      "4BHK": 2200,
      Penthouse: 3800,
    },
    pricePerSqFt: {
      affordable: 4000,
      mid: 6500,
      premium: 12000,
      luxury: 22000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 70,
      westFacingPenalty: 15,
      southFacingBonus: 0,
    },
    tips:
      "Ahmedabad offers the largest apartments per rupee in Tier-1 India. West-facing units suffer extreme summer heat — vastu alignment and sunlight scores carry extra weight here. Vastu compliance is a strong purchase driver in this market.",
  },

  kolkata: {
    label: "Kolkata",
    correctionCoefficient: {
      Studio: 1.00,
      "1BHK": 1.00,
      "2BHK": 1.00,
      "3BHK": 1.00,
      "4BHK": 1.00,
      Penthouse: 1.00,
    },
    carpetAreaMedian: {
      Studio: 380,
      "1BHK": 600,
      "2BHK": 900,
      "3BHK": 1300,
      "4BHK": 1800,
      Penthouse: 3000,
    },
    pricePerSqFt: {
      affordable: 4000,
      mid: 7000,
      premium: 13000,
      luxury: 24000,
    },
    norms: {
      dryBalconyExpected: false,
      poojaRoomExpected: true,
      minKitchenAreaSqFt: 60,
      westFacingPenalty: 8,
      southFacingBonus: 0,
    },
    tips:
      "Kolkata's warm, humid climate makes cross-ventilation a priority. Ground-floor units near water bodies can face flooding risk — check floor level carefully. Lake-town and EM Bypass corridors have rapidly appreciating land.",
  },
};

export function getCityBenchmark(city: CityKey): CityBenchmark {
  return CITY_BENCHMARKS[city];
}

export function getBenchmarkPriceForSegment(city: CityKey, pricePerSqFt: number): string {
  const b = CITY_BENCHMARKS[city].pricePerSqFt;
  if (pricePerSqFt <= b.affordable) return "Affordable";
  if (pricePerSqFt <= b.mid) return "Mid";
  if (pricePerSqFt <= b.premium) return "Premium";
  return "Luxury";
}
