import { redis } from "@/lib/redis";
import { appendItems, readItems } from "@/lib/storage";
import type { TSVReport, TSVIndexEntry } from "./types";

const REPORT_TTL = 60 * 60 * 24 * 30; // 30 days
const INDEX_KEY = "tsv:index";

function reportKey(id: string): string {
  return `tsv:report:${id}`;
}

export async function saveTSVReport(report: TSVReport): Promise<void> {
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

  try {
    await redis.set(reportKey(report.id), report, REPORT_TTL);
    const existing = await redis.get<TSVIndexEntry[]>(INDEX_KEY) ?? [];
    existing.unshift(entry);
    await redis.set(INDEX_KEY, existing.slice(0, 500), REPORT_TTL);
  } catch {
    await appendItems<TSVReport>("tsv-reports", [report]);
    await appendItems<TSVIndexEntry>("tsv-index", [entry]);
  }
}

export async function getTSVReport(id: string): Promise<TSVReport | null> {
  try {
    const cached = await redis.get<TSVReport>(reportKey(id));
    if (cached) return cached;
  } catch { /* fall through */ }
  const all = await readItems<TSVReport>("tsv-reports");
  return all.find((r) => r.id === id) ?? null;
}

export async function listTSVReports(filters?: {
  city?: string;
  unitType?: string;
  minScore?: number;
  maxPrice?: number;
  search?: string;
  limit?: number;
}): Promise<TSVIndexEntry[]> {
  let entries: TSVIndexEntry[] = [];
  try {
    entries = await redis.get<TSVIndexEntry[]>(INDEX_KEY) ?? [];
  } catch { /* fall through */ }
  if (entries.length === 0) {
    entries = await readItems<TSVIndexEntry>("tsv-index");
  }

  let filtered = entries;
  if (filters?.city) filtered = filtered.filter((e) => e.city === filters.city);
  if (filters?.unitType) filtered = filtered.filter((e) => e.unitType === filters.unitType);
  if (filters?.minScore !== undefined) filtered = filtered.filter((e) => e.composite >= filters.minScore!);
  if (filters?.maxPrice !== undefined) filtered = filtered.filter((e) => (e.askingPricePerSqFt ?? 0) <= filters.maxPrice!);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.projectName.toLowerCase().includes(q) ||
        (e.locality ?? "").toLowerCase().includes(q) ||
        (e.developerName ?? "").toLowerCase().includes(q),
    );
  }
  return filtered.slice(0, filters?.limit ?? 50);
}

export async function getTSVReportsByIds(ids: string[]): Promise<(TSVReport | null)[]> {
  return Promise.all(ids.map((id) => getTSVReport(id)));
}
