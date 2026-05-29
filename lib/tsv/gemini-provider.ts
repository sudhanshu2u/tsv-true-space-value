import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { TSVInput, TSVCoreScore, TSVBuildingScore, TSVValueScore, FloorPlanAnalysis } from "./types";
import { buildTSVNarrativePrompt, buildFloorPlanAnalysisPrompt } from "./prompt";

const narrativeSchema = {
  type: SchemaType.OBJECT,
  properties: {
    narrative: { type: SchemaType.STRING },
    strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    buyerSuitability: {
      type: SchemaType.OBJECT,
      properties: {
        endUser: {
          type: SchemaType.OBJECT,
          properties: {
            rating: { type: SchemaType.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
            reason: { type: SchemaType.STRING },
          },
          required: ["rating", "reason"],
        },
        investor: {
          type: SchemaType.OBJECT,
          properties: {
            rating: { type: SchemaType.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
            reason: { type: SchemaType.STRING },
          },
          required: ["rating", "reason"],
        },
        nri: {
          type: SchemaType.OBJECT,
          properties: {
            rating: { type: SchemaType.STRING, enum: ["Excellent", "Good", "Fair", "Poor"] },
            reason: { type: SchemaType.STRING },
          },
          required: ["rating", "reason"],
        },
      },
      required: ["endUser", "investor", "nri"],
    },
    investmentOutlook: { type: SchemaType.STRING },
  },
  required: ["narrative", "strengths", "weaknesses", "buyerSuitability", "investmentOutlook"],
} as const;

const floorPlanSchema = {
  type: SchemaType.OBJECT,
  properties: {
    bedrooms: { type: SchemaType.NUMBER },
    bathrooms: { type: SchemaType.NUMBER },
    estimatedCarpetAreaSqFt: { type: SchemaType.NUMBER },
    passageAreaPercent: { type: SchemaType.NUMBER },
    roomsRectangular: { type: SchemaType.BOOLEAN },
    dryBalconyPresent: { type: SchemaType.BOOLEAN },
    storagePresent: { type: SchemaType.BOOLEAN },
    kitchenShape: { type: SchemaType.STRING, enum: ["straight", "L_shape", "U_shape", "island", "galley"] },
    externalWindowsCount: { type: SchemaType.NUMBER },
    crossVentilation: { type: SchemaType.STRING, enum: ["opposite_walls", "adjacent_walls", "single_sided"] },
    notes: { type: SchemaType.STRING },
  },
  required: [
    "bedrooms",
    "bathrooms",
    "estimatedCarpetAreaSqFt",
    "passageAreaPercent",
    "roomsRectangular",
    "dryBalconyPresent",
    "storagePresent",
    "kitchenShape",
    "externalWindowsCount",
    "crossVentilation",
    "notes",
  ],
} as const;

export interface TSVNarrativeResult {
  narrative: string;
  strengths: string[];
  weaknesses: string[];
  buyerSuitability: {
    endUser: { rating: "Excellent" | "Good" | "Fair" | "Poor"; reason: string };
    investor: { rating: "Excellent" | "Good" | "Fair" | "Poor"; reason: string };
    nri: { rating: "Excellent" | "Good" | "Fair" | "Poor"; reason: string };
  };
  investmentOutlook: string;
}

export class TSVGeminiProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash") {
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateNarrative(
    input: TSVInput,
    core: TSVCoreScore,
    building: TSVBuildingScore,
    value: TSVValueScore,
    composite: number,
  ): Promise<TSVNarrativeResult> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: narrativeSchema as any,
        temperature: 0.7,
      },
    });

    const prompt = buildTSVNarrativePrompt(input, core, building, value, composite);
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text()) as TSVNarrativeResult;
  }

  async analyzeFloorPlan(base64ImageDataUrl: string): Promise<FloorPlanAnalysis> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        responseSchema: floorPlanSchema as any,
        temperature: 0.3,
      },
    });

    // Extract MIME type and base64 data from data URL
    const match = base64ImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data URL format.");
    const [, mimeType, base64Data] = match;

    const result = await model.generateContent([
      buildFloorPlanAnalysisPrompt(),
      { inlineData: { mimeType, data: base64Data } },
    ]);

    return JSON.parse(result.response.text()) as FloorPlanAnalysis;
  }
}
