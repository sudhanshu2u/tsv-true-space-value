export type CityKey =
  | "mumbai"
  | "delhi_ncr"
  | "bangalore"
  | "pune"
  | "hyderabad"
  | "chennai"
  | "ahmedabad"
  | "kolkata";

export const CITY_LABELS: Record<CityKey, string> = {
  mumbai: "Mumbai",
  delhi_ncr: "Delhi NCR",
  bangalore: "Bangalore",
  pune: "Pune",
  hyderabad: "Hyderabad",
  chennai: "Chennai",
  ahmedabad: "Ahmedabad",
  kolkata: "Kolkata",
};

export type UnitType = "Studio" | "1BHK" | "2BHK" | "3BHK" | "4BHK" | "Penthouse";

export type Facing =
  | "North"
  | "South"
  | "East"
  | "West"
  | "NE"
  | "NW"
  | "SE"
  | "SW";

export type ViewType =
  | "sea_river_lake"
  | "golf_course"
  | "city_skyline"
  | "park_garden"
  | "open_land"
  | "internal_courtyard"
  | "road_obstructed";

export const VIEW_LABELS: Record<ViewType, string> = {
  sea_river_lake: "Sea / River / Lake",
  golf_course: "Golf Course",
  city_skyline: "City Skyline",
  park_garden: "Park / Garden",
  open_land: "Open Land (development risk)",
  internal_courtyard: "Internal / Courtyard",
  road_obstructed: "Road / Obstructed",
};

export type ViewAngle = "wide_180plus" | "medium_90_180" | "narrow_45_90" | "slot_under_45";

export const VIEW_ANGLE_LABELS: Record<ViewAngle, string> = {
  wide_180plus: "Wide panoramic (>180°)",
  medium_90_180: "Medium (90–180°)",
  narrow_45_90: "Narrow (45–90°)",
  slot_under_45: "Slot view (<45°)",
};

export type ParkingType =
  | "dedicated_covered"
  | "mechanical_stack"
  | "dedicated_open"
  | "visitor_only";

export type PowerBackup = "full" | "partial" | "none";
export type WaterSupply = "24x7_borewell" | "municipal_tank" | "irregular";
export type CrossVentilation = "opposite_walls" | "adjacent_walls" | "single_sided";

export type VastuDirection =
  | "North"
  | "NE"
  | "East"
  | "SE"
  | "South"
  | "SW"
  | "West"
  | "NW"
  | "unknown";

export type AmenityKey =
  | "gym"
  | "swimming_pool"
  | "clubhouse"
  | "childrens_play"
  | "jogging_track"
  | "sports_tt_badminton"
  | "coworking"
  | "senior_citizen_zone"
  | "pet_zone"
  | "concierge"
  | "amphitheatre"
  | "library"
  | "rooftop_garden"
  | "spa_sauna"
  | "business_centre";

export const AMENITY_LABELS: Record<AmenityKey, string> = {
  gym: "Gymnasium (equipped)",
  swimming_pool: "Swimming Pool",
  clubhouse: "Clubhouse",
  childrens_play: "Children's Play Area",
  jogging_track: "Jogging Track",
  sports_tt_badminton: "Sports (TT / Badminton / Squash)",
  coworking: "Co-working Space",
  senior_citizen_zone: "Senior Citizen Zone",
  pet_zone: "Pet Zone",
  concierge: "Concierge / Reception",
  amphitheatre: "Amphitheatre / Open Stage",
  library: "Library / Reading Room",
  rooftop_garden: "Rooftop Garden / Sky Deck",
  spa_sauna: "Spa / Sauna / Steam",
  business_centre: "Business Centre",
};

export type FireSafetyFeature =
  | "sprinklers"
  | "fire_noc"
  | "smoke_detectors"
  | "fire_exits"
  | "pressurized_stairwells"
  | "fire_pump_room"
  | "refuge_area"
  | "fire_marshal";

export const FIRE_SAFETY_LABELS: Record<FireSafetyFeature, string> = {
  sprinklers: "Automatic Sprinklers",
  fire_noc: "Fire NOC / Clearance",
  smoke_detectors: "Smoke Detectors",
  fire_exits: "Fire Exits (every floor)",
  pressurized_stairwells: "Pressurized Stairwells",
  fire_pump_room: "Fire Pump Room",
  refuge_area: "Refuge Area (high-rise)",
  fire_marshal: "Trained Fire Marshal",
};

// ────────────────────────────────────────────────────────────────
// Input — all fields beyond identity are optional.
// Primary flow: upload floor plan image → Gemini fills space fields.
// Enhancement flow: user adds orientation, building, price for fuller score.
// ────────────────────────────────────────────────────────────────

export interface TSVInput {
  // Identity (optional — anonymous rating allowed)
  projectName?: string;
  developerName?: string;
  unitType?: UnitType;
  city?: CityKey;
  locality?: string;

  // Floor plan image — the primary input
  floorPlanImage?: string; // base64 data URL

  // Space — populated by Gemini Vision or manual entry
  carpetArea?: number;
  superBuiltupArea?: number;
  balconyArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  ceilingHeight?: number; // feet
  kitchenArea?: number;
  storagePresent?: boolean;
  dryBalconyPresent?: boolean;
  passageAreaPercent?: number; // % of carpet area that is passage/dead space
  roomsRectangular?: boolean;

  // Location — needed for sunlight score
  floorNumber?: number;
  totalFloors?: number;
  facing?: Facing;

  // View — needed for view score
  viewType?: ViewType;
  viewAngle?: ViewAngle;

  // Ventilation — from floor plan or manual
  externalWindowsCount?: number;
  crossVentilation?: CrossVentilation;

  // Vastu — all optional
  entranceDirection?: VastuDirection;
  kitchenDirection?: VastuDirection;
  masterBedroomDirection?: VastuDirection;
  toiletDirection?: VastuDirection;
  poojaRoomDirection?: VastuDirection;

  // Building — needed for building score
  totalUnitsInProject?: number;
  liftCount?: number;
  evReady?: boolean;
  parkingType?: ParkingType;
  powerBackup?: PowerBackup;
  waterSupply?: WaterSupply;
  fireSafetyFeatures?: FireSafetyFeature[];
  securityFeatures?: string[];
  amenities?: AmenityKey[];
  amenitiesOnSameLevel?: boolean;

  // Pricing — needed for value score
  askingPricePerSqFt?: number;
}

// ────────────────────────────────────────────────────────────────
// Score sub-types
// ────────────────────────────────────────────────────────────────

export interface DimensionScore {
  available: boolean; // false = required data not provided; score is 0 and should be shown as N/A
  score: number; // 0-100 (meaningful only when available=true)
  label: string;
  plainEnglish: string;
  analystNote: string;
  missingReason?: string; // shown when available=false, e.g. "Add facing direction to unlock"
  percentileRank?: number;
}

export interface TSVCoreScore {
  total: number; // weighted composite of available dimensions only
  availableDimensionCount: number; // out of 6
  functionalSpace: DimensionScore;
  livability: DimensionScore;
  ventilation: DimensionScore;
  sunlight: DimensionScore;
  view: DimensionScore;
  vastu: {
    strict: number;
    moderate: number;
    modern: number;
    score: DimensionScore;
  };
}

export interface TSVBuildingScore {
  total: number;
  available: boolean; // false = no building data provided at all
  parking: DimensionScore;
  elevators: DimensionScore;
  fireSafety: DimensionScore;
  waterAndPower: DimensionScore;
  security: DimensionScore;
  amenityUtility: DimensionScore;
}

export interface TSVValueScore {
  total: number;
  available: boolean; // false = no price provided
  pricePerSqFt: number;
  cityBenchmarkPrice: number;
  pricePremiumPercent: number;
  priceCompetitivenessScore: number;
  valueRating: "Undervalued" | "Fair Value" | "Overpriced";
}

// What data is present — shown on the report to guide the user
export interface DataCompleteness {
  hasPlan: boolean;           // floor plan image or carpet area provided
  hasOrientation: boolean;    // facing direction provided
  hasView: boolean;           // view type provided
  hasVastu: boolean;          // at least entrance direction provided
  hasBuilding: boolean;       // at least parking type provided
  hasPrice: boolean;          // asking price provided
  hasCity: boolean;           // city provided (for normalization)
  completenessPercent: number; // 0–100
}

export interface BuyerSuitability {
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  reason: string;
}

// ────────────────────────────────────────────────────────────────
// Full report
// ────────────────────────────────────────────────────────────────

export interface TSVReport {
  id: string;
  mobile?: string;
  input: TSVInput;
  completeness: DataCompleteness;
  scores: {
    core: TSVCoreScore;
    building: TSVBuildingScore;
    value: TSVValueScore;
    composite: number; // blended from available scores only
    cityNormalized: number;
    isPlanOnly: boolean; // true when only floor plan data available
  };
  report: {
    strengths: string[];
    weaknesses: string[];
    planObservations: string[]; // from Gemini Vision — what was seen in the floor plan
    buyerSuitability?: {
      endUser: BuyerSuitability;
      investor: BuyerSuitability;
      nri: BuyerSuitability;
    };
    narrative: string;
    valueRating?: "Undervalued" | "Fair Value" | "Overpriced";
    verdictLabel: "Excellent" | "Great Buy" | "Good" | "Fair" | "Caution" | "Avoid";
    verdictColor: "green" | "blue" | "amber" | "orange" | "red";
  };
  ts: string;
}

// Lightweight index entry stored separately for explore/search
export interface TSVIndexEntry {
  id: string;
  projectName: string;
  developerName?: string;
  unitType?: UnitType;
  city?: CityKey;
  locality?: string;
  composite: number;
  coreScore: number;
  buildingScore: number;
  valueScore: number;
  isPlanOnly: boolean;
  completenessPercent: number;
  valueRating?: "Undervalued" | "Fair Value" | "Overpriced";
  verdictLabel: string;
  askingPricePerSqFt?: number;
  ts: string;
}

// Floor plan analysis returned by Gemini Vision
export interface FloorPlanAnalysis {
  bedrooms: number;
  bathrooms: number;
  estimatedCarpetAreaSqFt: number;
  passageAreaPercent: number;
  roomsRectangular: boolean;
  dryBalconyPresent: boolean;
  storagePresent: boolean;
  kitchenShape: "straight" | "L_shape" | "U_shape" | "island" | "galley";
  externalWindowsCount: number;
  crossVentilation: CrossVentilation;
  notes: string;
}
