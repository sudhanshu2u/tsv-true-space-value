"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TSVReport } from "@/lib/tsv/types";
import { CITY_LABELS } from "@/lib/tsv/types";

const winner = (scores: number[]): number => {
  const max = Math.max(...scores);
  return scores.findIndex((s) => s === max);
};

const scoreColor = (score: number) =>
  score >= 80 ? "text-green-700" : score >= 65 ? "text-blue-700" : score >= 50 ? "text-amber-700" : "text-red-700";

const verdictBg: Record<string, string> = {
  Excellent: "bg-green-100 text-green-800",
  "Great Buy": "bg-green-100 text-green-800",
  Good: "bg-blue-100 text-blue-800",
  Fair: "bg-amber-100 text-amber-800",
  Caution: "bg-orange-100 text-orange-800",
  Avoid: "bg-red-100 text-red-800",
};

const valueRatingBg: Record<string, string> = {
  Undervalued: "bg-green-100 text-green-800",
  "Fair Value": "bg-amber-100 text-amber-800",
  Overpriced: "bg-red-100 text-red-800",
};

function CompareContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const [reports, setReports] = useState<(TSVReport | null)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!idsParam) return;
    setLoading(true);
    fetch(`/api/tsv/compare?ids=${idsParam}`)
      .then((r) => r.json())
      .then((d) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [idsParam]);

  const validReports = reports.filter(Boolean) as TSVReport[];

  const DIMENSIONS = validReports.length > 0
    ? [
        { label: "TSV Composite", scores: validReports.map((r) => r.scores.composite) },
        { label: "TSV-Core (Apt Quality)", scores: validReports.map((r) => r.scores.core.total) },
        { label: "TSV-Building (Infra)", scores: validReports.map((r) => r.scores.building.total) },
        { label: "TSV-Value (Price-adj)", scores: validReports.map((r) => r.scores.value.total) },
        { label: "Functional Space", scores: validReports.map((r) => r.scores.core.functionalSpace.score) },
        { label: "Livability", scores: validReports.map((r) => r.scores.core.livability.score) },
        { label: "Ventilation", scores: validReports.map((r) => r.scores.core.ventilation.score) },
        { label: "Sunlight", scores: validReports.map((r) => r.scores.core.sunlight.score) },
        { label: "View Quality", scores: validReports.map((r) => r.scores.core.view.score) },
        { label: "Vastu Compliance", scores: validReports.map((r) => r.scores.core.vastu.moderate) },
        { label: "Amenities", scores: validReports.map((r) => r.scores.building.amenityUtility.score) },
        { label: "Parking", scores: validReports.map((r) => r.scores.building.parking.score) },
        { label: "Water & Power", scores: validReports.map((r) => r.scores.building.waterAndPower.score) },
        { label: "Fire Safety", scores: validReports.map((r) => r.scores.building.fireSafety.score) },
      ]
    : [];

  return (
    <div className="min-h-screen bg-sand">
      <nav className="border-b border-black/8 bg-sand/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-serif font-bold text-forest">TSV</Link>
            <span className="text-sm text-gray-400">Compare</span>
          </div>
          <div className="flex gap-3">
            <Link href="/explore" className="text-sm text-gray-500 hover:text-forest">← Explore</Link>
            <Link href="/rate" className="bg-forest text-sand text-sm font-semibold px-4 py-2 rounded-lg hover:bg-forest/90 transition-colors">
              Rate New
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!idsParam && (
          <div className="text-center py-20">
            <p className="text-lg font-serif text-forest mb-2">No apartments selected to compare</p>
            <p className="text-sm text-gray-400 mb-6">Go to Explore and select 2–3 apartments to compare.</p>
            <Link href="/explore?compareMode=true" className="inline-block bg-forest text-sand text-sm font-semibold px-6 py-3 rounded-lg">
              Go to Explore →
            </Link>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading comparison…</p>
          </div>
        )}

        {!loading && validReports.length >= 2 && (
          <div>
            <h1 className="text-2xl font-serif font-bold text-forest mb-8">Side-by-Side Comparison</h1>

            {/* Headers */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 pr-4 w-48 text-xs text-gray-400 uppercase tracking-wider font-medium">Dimension</th>
                    {validReports.map((r, i) => (
                      <th key={i} className="text-center py-3 px-3">
                        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                          <p className="font-serif font-bold text-forest text-sm leading-tight">{r.input.projectName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{r.input.unitType ?? ""}{r.input.city ? ` · ${CITY_LABELS[r.input.city]}` : ""}</p>
                          <p className="text-xs text-gray-400">{r.input.locality ?? ""}</p>
                          <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${verdictBg[r.report.verdictLabel] ?? ""}`}>
                              {r.report.verdictLabel}
                            </span>
                            {r.report.valueRating && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${valueRatingBg[r.report.valueRating] ?? ""}`}>
                                {r.report.valueRating}
                              </span>
                            )}
                          </div>
                          {r.input.askingPricePerSqFt && (
                            <p className="text-xs text-gray-400 mt-2">₹{r.input.askingPricePerSqFt.toLocaleString()}/sqft</p>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Divider */}
                  <tr><td colSpan={validReports.length + 1} className="pb-2" /></tr>

                  {DIMENSIONS.map((dim, di) => {
                    const winIdx = winner(dim.scores);
                    const isTopGroup = di < 4;
                    return (
                      <tr
                        key={dim.label}
                        className={`${isTopGroup ? "bg-gray-50/50 border-b border-gray-100" : "border-b border-gray-50"}`}
                      >
                        <td className={`py-3 pr-4 text-xs font-medium text-gray-500 ${isTopGroup ? "font-semibold text-gray-700" : ""}`}>
                          {dim.label}
                        </td>
                        {dim.scores.map((score, si) => (
                          <td key={si} className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`${isTopGroup ? "text-xl" : "text-base"} font-bold font-serif ${scoreColor(score)} ${si === winIdx ? "underline decoration-dotted" : ""}`}>
                                {score}
                              </span>
                              {si === winIdx && dim.scores.filter((s) => s === Math.max(...dim.scores)).length === 1 && (
                                <span className="text-[9px] text-gold-dark font-semibold uppercase tracking-wider">Best</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* Price row */}
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-3 pr-4 text-xs font-semibold text-gray-700">Price/sqft</td>
                    {validReports.map((r, i) => {
                      const prices = validReports.map((x) => x.input.askingPricePerSqFt ?? 0).filter((p) => p > 0);
                      const price = r.input.askingPricePerSqFt;
                      const isCheapest = !!price && price === Math.min(...prices);
                      return (
                        <td key={i} className="py-3 px-3 text-center">
                          {price ? (
                            <span className={`text-base font-bold font-serif ${isCheapest ? "text-green-700" : "text-gray-700"}`}>
                              ₹{price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">N/A</span>
                          )}
                          {isCheapest && <div className="text-[9px] text-green-600 font-semibold uppercase tracking-wider">Lowest</div>}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Buyer suitability */}
                  {(["endUser", "investor", "nri"] as const).map((key) => (
                    <tr key={key} className="border-b border-gray-50">
                      <td className="py-2 pr-4 text-xs text-gray-500 capitalize">
                        {key === "endUser" ? "For End-User" : key === "investor" ? "For Investor" : "For NRI"}
                      </td>
                      {validReports.map((r, i) => {
                        const s = r.report.buyerSuitability?.[key];
                        return (
                          <td key={i} className="py-2 px-3 text-center">
                            {s ? (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                s.rating === "Excellent" ? "bg-green-100 text-green-800" :
                                s.rating === "Good" ? "bg-blue-100 text-blue-800" :
                                s.rating === "Fair" ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                {s.rating}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">N/A</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* View full report links */}
            <div className="mt-8 flex flex-wrap gap-3">
              {validReports.map((r, i) => (
                <Link
                  key={i}
                  href={`/report/${r.id}`}
                  className="text-sm font-semibold text-gold-dark hover:underline"
                >
                  Full report: {r.input.projectName} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" /></div>}>
      <CompareContent />
    </Suspense>
  );
}
