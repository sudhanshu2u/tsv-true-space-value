import Anthropic from "@anthropic-ai/sdk";
import type { WebProjectData } from "./types";

const extractionTool: Anthropic.Tool = {
  name: "submit_project_data",
  description: "Submit structured real estate project data extracted from search results or knowledge",
  input_schema: {
    type: "object",
    properties: {
      askingPricePerSqFt: { type: "number", description: "Asking price in INR per sq ft of RERA carpet area" },
      totalFloors: { type: "number" },
      totalUnitsInProject: { type: "number" },
      liftCount: { type: "number" },
      amenities: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "gym", "swimming_pool", "clubhouse", "childrens_play", "jogging_track",
            "sports_tt_badminton", "coworking", "senior_citizen_zone", "pet_zone",
            "concierge", "amphitheatre", "library", "rooftop_garden", "spa_sauna", "business_centre",
          ],
        },
      },
      fireSafetyFeatures: {
        type: "array",
        items: {
          type: "string",
          enum: ["sprinklers", "fire_noc", "smoke_detectors", "fire_exits", "pressurized_stairwells", "fire_pump_room", "refuge_area", "fire_marshal"],
        },
      },
      parkingType: { type: "string", enum: ["dedicated_covered", "mechanical_stack", "dedicated_open", "visitor_only"] },
      powerBackup: { type: "string", enum: ["full", "partial", "none"] },
      waterSupply: { type: "string", enum: ["24x7_borewell", "municipal_tank", "irregular"] },
      evReady: { type: "boolean" },
      developerName: { type: "string" },
      reraNumber: { type: "string" },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "high = directly stated in search results; medium = inferred; low = from training knowledge only",
      },
      sources: { type: "array", items: { type: "string" }, description: "URLs or source labels" },
      summary: { type: "string", description: "1-2 sentence summary of what was found" },
    },
    required: ["confidence", "sources"],
  },
};

export async function enrichProjectFromWeb(
  projectName: string,
  city: string,
  locality?: string,
  anthropicApiKey?: string,
  tavilyApiKey?: string,
): Promise<WebProjectData | null> {
  if (!anthropicApiKey) return null;

  const client = new Anthropic({ apiKey: anthropicApiKey });
  const searchQuery = `${projectName} ${locality ?? ""} ${city} apartment price amenities RERA 2024 2025`.trim();

  let searchContent = "";
  const sources: string[] = [];

  // Tavily search if key is configured
  if (tavilyApiKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyApiKey,
          query: searchQuery,
          search_depth: "basic",
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        }),
      });
      if (res.ok) {
        const data = await res.json() as {
          answer?: string;
          results?: Array<{ title: string; url: string; content: string }>;
        };
        const results = data.results ?? [];
        sources.push(...results.map((r) => r.url));
        searchContent =
          (data.answer ? `Summary: ${data.answer}\n\n` : "") +
          results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`)
            .join("\n\n---\n\n");
      }
    } catch {
      // Search failed — fall through to Claude-knowledge fallback
    }
  }

  const systemPrompt = `You are a real estate analyst specialising in Indian residential property. Extract structured data about the project from the information provided. Only include fields you are confident about — omit fields where you have no reliable data. Never fabricate prices or RERA numbers.`;

  const userPrompt = searchContent
    ? `Extract structured project data for "${projectName}" in ${locality ? `${locality}, ` : ""}${city} from these search results. Use confidence "high" for directly stated facts, "medium" for inferred, "low" for uncertain.\n\n${searchContent}`
    : `Based on your training knowledge about "${projectName}" in ${locality ? `${locality}, ` : ""}${city}, India — extract what you reliably know about this project. Use confidence "low" and sources: ["training_data"]. Omit prices and RERA numbers unless you are highly certain.`;

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools: [extractionTool],
      tool_choice: { type: "tool", name: "submit_project_data" },
      messages: [{ role: "user", content: userPrompt }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") return null;
    const result = toolUse.input as WebProjectData;
    // Merge in actual source URLs if Tavily provided them
    if (sources.length > 0 && (!result.sources || result.sources.length === 0)) {
      result.sources = sources;
    }
    return result;
  } catch {
    return null;
  }
}
