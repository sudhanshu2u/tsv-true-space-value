import { getSupabase } from "@/lib/supabase";
import { appendItems, readItems } from "@/lib/storage";
import type { TSVReport, TSVIndexEntry } from "./types";

const REPORTS_TABLE = "tsv_reports";
const INDEX_TABLE = "tsv_index";

// ── Save ─────────────────────────────────────────────────────────
export async function saveTSVReport(report: TSVReport): Promise<void> {
  const supabase = getSupabase();

  const entry: TSVIndexEntry = {
    id: report.id,
    projectName: report.input.projectName ?? "Unnamed Apartment",
    developerName: report.input.developerName,
    unitType: report.input.unitType,
    city: report.input.city,
    locality: report.input.locality,
    composite: report.scores.composite,
    coreScore: report.scores.core.total,
    buildingScore: report.scores.building.total,
    valueScore: report.scores.value.total,
    isPlanOnly: report.scores.isPlanOnly,
    completenessPercent: report.completeness.completenessPercent,
    valueRating: report.report.valueRating,
    verdictLabel: report.report.verdictLabel,
    askingPricePerSqFt: report.input.askingPricePerSqFt,
    ts: report.ts,
  };

  if (supabase) {
    await supabase.from(REPORTS_TABLE).upsert({ id: report.id, data: report, created_at: report.ts });
    await supabase.from(INDEX_TABLE).upsert({
      id: entry.id,
      project_name: entry.projectName,
      developer_name: entry.developerName ?? null,
      unit_type: entry.unitType ?? null,
      city: entry.city ?? null,
      locality: entry.locality ?? null,
      composite: entry.composite,
      core_score: entry.coreScore,
      building_score: entry.buildingScore,
      value_score: entry.valueScore,
      is_plan_only: entry.isPlanOnly,
      completeness_percent: entry.completenessPercent,
      value_rating: entry.valueRating ?? null,
      verdict_label: entry.verdictLabel,
      asking_price_per_sqft: entry.askingPricePerSqFt ?? null,
      created_at: entry.ts,
    });
  } else {
    await appendItems<TSVReport>("tsv-reports", [report]);
    await appendItems<TSVIndexEntry>("tsv-index", [entry]);
  }
}

// ── Fetch single report ───────────────────────────────────────────
export async function getTSVReport(id: string): Promise<TSVReport | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(REPORTS_TABLE)
      .select("data")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return data.data as TSVReport;
  }
  const all = await readItems<TSVReport>("tsv-reports");
  return all.find((r) => r.id === id) ?? null;
}

// ── List / filter ────────────────────────────────────────────────
export async function listTSVReports(filters?: {
  city?: string;
  unitType?: string;
  minScore?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
}): Promise<TSVIndexEntry[]> {
  const supabase = getSupabase();
  const limit = filters?.limit ?? 50;

  if (supabase) {
    let query = supabase
      .from(INDEX_TABLE)
      .select("*")
      .order("composite", { ascending: false })
      .limit(limit);

    if (filters?.city) query = query.eq("city", filters.city);
    if (filters?.unitType) query = query.eq("unit_type", filters.unitType);
    if (filters?.minScore !== undefined) query = query.gte("composite", filters.minScore);
    if (filters?.maxPrice !== undefined) query = query.lte("asking_price_per_sqft", filters.maxPrice);
    if (filters?.search) {
      query = query.or(
        `project_name.ilike.%${filters.search}%,locality.ilike.%${filters.search}%,developer_name.ilike.%${filters.search}%`,
      );
    }

    const { data, error } = await query;
    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      projectName: row.project_name,
      developerName: row.developer_name,
      unitType: row.unit_type,
      city: row.city,
      locality: row.locality,
      composite: row.composite,
      coreScore: row.core_score,
      buildingScore: row.building_score,
      valueScore: row.value_score,
      isPlanOnly: row.is_plan_only,
      completenessPercent: row.completeness_percent,
      valueRating: row.value_rating,
      verdictLabel: row.verdict_label,
      askingPricePerSqFt: row.asking_price_per_sqft,
      ts: row.created_at,
    })) as TSVIndexEntry[];
  }

  // File fallback (dev without Supabase)
  let entries = await readItems<TSVIndexEntry>("tsv-index");
  if (filters?.city) entries = entries.filter((e) => e.city === filters.city);
  if (filters?.unitType) entries = entries.filter((e) => e.unitType === filters.unitType);
  if (filters?.minScore !== undefined) entries = entries.filter((e) => e.composite >= filters.minScore!);
  if (filters?.maxPrice !== undefined) entries = entries.filter((e) => (e.askingPricePerSqFt ?? 0) <= filters.maxPrice!);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    entries = entries.filter(
      (e) =>
        e.projectName.toLowerCase().includes(q) ||
        (e.locality ?? "").toLowerCase().includes(q) ||
        (e.developerName ?? "").toLowerCase().includes(q),
    );
  }
  return entries.slice(0, limit);
}

// ── Fetch multiple reports for comparison ────────────────────────
export async function getTSVReportsByIds(ids: string[]): Promise<(TSVReport | null)[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(REPORTS_TABLE)
      .select("data")
      .in("id", ids);
    if (error || !data) return ids.map(() => null);
    const map = new Map(data.map((row) => [(row.data as TSVReport).id, row.data as TSVReport]));
    return ids.map((id) => map.get(id) ?? null);
  }
  return Promise.all(ids.map((id) => getTSVReport(id)));
}
