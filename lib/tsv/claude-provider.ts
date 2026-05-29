import Anthropic from "@anthropic-ai/sdk";
import type { TSVInput, TSVCoreScore, TSVBuildingScore, TSVValueScore, FloorPlanAnalysis } from "./types";
import { buildTSVNarrativePrompt, buildFloorPlanAnalysisPrompt } from "./prompt";

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

const narrativeTool: Anthropic.Tool = {
  name: "submit_narrative",
  description: "Submit the structured TSV narrative analysis",
  input_schema: {
    type: "object",
    properties: {
      narrative: { type: "string" },
      strengths: { type: "array", items: { type: "string" } },
      weaknesses: { type: "array", items: { type: "string" } },
      buyerSuitability: {
        type: "object",
        properties: {
          endUser: {
            type: "object",
            properties: {
              rating: { type: "string", enum: ["Excellent", "Good", "Fair", "Poor"] },
              reason: { type: "string" },
            },
            required: ["rating", "reason"],
          },
          investor: {
            type: "object",
            properties: {
              rating: { type: "string", enum: ["Excellent", "Good", "Fair", "Poor"] },
              reason: { type: "string" },
            },
            required: ["rating", "reason"],
          },
          nri: {
            type: "object",
            properties: {
              rating: { type: "string", enum: ["Excellent", "Good", "Fair", "Poor"] },
              reason: { type: "string" },
            },
            required: ["rating", "reason"],
          },
        },
        required: ["endUser", "investor", "nri"],
      },
      investmentOutlook: { type: "string" },
    },
    required: ["narrative", "strengths", "weaknesses", "buyerSuitability", "investmentOutlook"],
  },
};

const floorPlanTool: Anthropic.Tool = {
  name: "submit_floor_plan_analysis",
  description: "Submit the structured floor plan analysis",
  input_schema: {
    type: "object",
    properties: {
      bedrooms: { type: "number" },
      bathrooms: { type: "number" },
      estimatedCarpetAreaSqFt: { type: "number" },
      passageAreaPercent: { type: "number" },
      roomsRectangular: { type: "boolean" },
      dryBalconyPresent: { type: "boolean" },
      storagePresent: { type: "boolean" },
      kitchenShape: { type: "string", enum: ["straight", "L_shape", "U_shape", "island", "galley"] },
      externalWindowsCount: { type: "number" },
      crossVentilation: { type: "string", enum: ["opposite_walls", "adjacent_walls", "single_sided"] },
      notes: { type: "string" },
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
  },
};

export class TSVClaudeProvider {
  private client: Anthropic;
  private modelName: string;

  constructor(apiKey: string, modelName = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6") {
    this.client = new Anthropic({ apiKey });
    this.modelName = modelName;
  }

  async generateNarrative(
    input: TSVInput,
    core: TSVCoreScore,
    building: TSVBuildingScore,
    value: TSVValueScore,
    composite: number,
  ): Promise<TSVNarrativeResult> {
    const prompt = buildTSVNarrativePrompt(input, core, building, value, composite);
    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 2048,
      temperature: 0.7,
      tools: [narrativeTool],
      tool_choice: { type: "tool", name: "submit_narrative" },
      messages: [{ role: "user", content: prompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use block in response.");
    return toolUse.input as TSVNarrativeResult;
  }

  async analyzeFloorPlan(base64ImageDataUrl: string): Promise<FloorPlanAnalysis> {
    const match = base64ImageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid image data URL format.");
    const [, mimeType, base64Data] = match;

    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!supportedTypes.includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}. Use JPEG, PNG, GIF, or WebP.`);
    }

    const response = await this.client.messages.create({
      model: this.modelName,
      max_tokens: 1024,
      temperature: 0.3,
      tools: [floorPlanTool],
      tool_choice: { type: "tool", name: "submit_floor_plan_analysis" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Data,
              },
            },
            { type: "text", text: buildFloorPlanAnalysisPrompt() },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use block in response.");
    return toolUse.input as FloorPlanAnalysis;
  }
}
