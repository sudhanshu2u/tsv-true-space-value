"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import VerdictBanner from "@/components/VerdictBanner";
import ScoreGauge from "@/components/ScoreGauge";
import type { TSVReport, DimensionScore } from "@/lib/tsv/types";
import { CITY_LABELS } from "@/lib/tsv/types";

// ── Dimension row: shows score bar OR "Not provided" badge ────────
function DimRow({ dim, analystMode }: { dim: DimensionScore; analystMode: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (!dim.available) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">{dim.label}</span>
          <span className="text-xs text-gray-300 border border-gray-200 px-2.5 py-1 rounded-full font-medium">
            Not provided
          </span>
        </div>
        {dim.missingReason && (
          <p className="text-xs text-gray-400 mt-1 italic">{dim.missingReason}</p>
        )}
      </div>
    );
  }

  const barColor =
    dim.score >= 80 ? "bg-green-500"
    : dim.score >= 65 ? "bg-blue-500"
    : dim.score >= 50 ? "bg-amber-500"
    : dim.score >= 35 ? "bg-orange-500"
    : "bg-red-500";

  const badge =
    dim.score >= 80 ? "bg-green-100 text-green-800"
    : dim.score >= 65 ? "bg-blue-100 text-blue-800"
    : dim.score >= 50 ? "bg-amber-100 text-amber-800"
    : dim.score >= 35 ? "bg-orange-100 text-orange-800"
    : "bg-red-100 text-red-800";

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-800">{dim.label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{dim.score}/100</span>
          {analystMode && dim.analystNote && (
            <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
              {expanded ? "less" : "details"}
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${dim.score}%`, transition: "width 0.6s ease-out" }} />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{dim.plainEnglish}</p>
      {expanded && dim.analystNote && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono leading-relaxed border-l-2 border-gold">
          {dim.analystNote}
        </div>
      )}
    </div>
  );
}

// ── Completeness progress bar ─────────────────────────────────────
function CompletenessBar({ pct, isPlanOnly }: { pct: number; isPlanOnly: boolean }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-amber-800">
          {isPlanOnly ? "Floor Plan Score" : "Data Completeness"}
        </span>
        <span className="text-sm font-bold text-amber-800">{pct}%</span>
      </div>
      <div className="h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%`, transition: "width 0.8s ease-out" }} />
      </div>
      <p className="text-xs text-amber-700">
        {isPlanOnly
          ? "Score is based on the floor plan only. Add orientation, building details and asking price for a complete report."
          : `${100 - pct}% of scoring data still missing. Add more details to improve accuracy.`}
      </p>
    </div>
  );
}

const ratingColor: Record<string, string> = {
  Excellent: "text-green-700 bg-green-50",
  Good: "text-blue-700 bg-blue-50",
  Fair: "text-amber-700 bg-amber-50",
  Poor: "text-red-700 bg-red-50",
};
const ratingIcon: Record<string, string> = { Excellent: "★", Good: "◆", Fair: "◉", Poor: "○" };

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<TSVReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [analystMode, setAnalystMode] = useState(false);

  useEffect(() => {
    fetch(`/api/reports?id=${id}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading report…</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-serif text-forest mb-2">Report not found</p>
          <p className="text-sm text-gray-400 mb-6">This report may have expired or the ID is invalid.</p>
          <Link href="/" className="text-sm text-gold-dark hover:underline">← Back to TSV</Link>
        </div>
      </div>
    );
  }

  const { input, scores, report: r, completeness } = report;
  const cityLabel = input.city ? CITY_LABELS[input.city] : "";
  const isPlanOnly = scores.isPlanOnly;

  return (
    <div className="min-h-screen bg-sand print:bg-white">
      {/* Nav */}
      <nav className="border-b border-black/8 bg-sand/80 backdrop-blur-sm sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-bold text-forest">TSV</Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAnalystMode(!analystMode)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${analystMode ? "bg-forest text-sand border-forest" : "border-gray-200 text-gray-600 hover:border-forest"}`}
            >
              {analystMode ? "◆ Analyst View" : "◇ Analyst View"}
            </button>
            <button onClick={() => window.print()} className="text-xs text-gray-500 hover:text-forest transition-colors">Print ↗</button>
            <Link href="/rate" className="text-xs font-semibold text-gold-dark hover:underline">Rate another →</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5 print:py-4">

        {/* Verdict Banner */}
        <VerdictBanner
          projectName={input.projectName ?? "Floor Plan Analysis"}
          developerName={input.developerName ?? ""}
          unitType={input.unitType ?? ""}
          city={cityLabel}
          locality={input.locality ?? ""}
          composite={scores.composite}
          coreScore={scores.core.total}
          buildingScore={scores.building.available ? scores.building.total : -1}
          valueScore={scores.value.available ? scores.value.total : -1}
          verdictLabel={r.verdictLabel}
          valueRating={r.valueRating}
          reportId={report.id}
        />

        {/* Completeness bar */}
        <CompletenessBar pct={completeness.completenessPercent} isPlanOnly={isPlanOnly} />

        {/* Plan observations from Gemini Vision */}
        {r.planObservations.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">AI Observations from Floor Plan</p>
            <ul className="space-y-1">
              {r.planObservations.map((obs, i) => (
                <li key={i} className="text-sm text-blue-800 flex gap-2">
                  <span className="text-blue-400 shrink-0">·</span>{obs}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick insight cards — only for available strengths */}
        {r.strengths.length > 0 && (
          <div className="grid md:grid-cols-3 gap-3">
            {r.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="bg-green-50 border border-green-100 rounded-xl p-4">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-sm text-green-800 font-medium mt-1 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        )}

        {/* Narrative */}
        {r.narrative && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Analysis</h2>
            <div className="text-gray-700 text-sm leading-relaxed font-serif whitespace-pre-line">{r.narrative}</div>
          </div>
        )}

        {/* Core Quality */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-forest">Core Quality</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {scores.core.availableDimensionCount}/6 dimensions scored
                {isPlanOnly ? " — from floor plan" : ""}
              </p>
            </div>
            <ScoreGauge score={scores.core.total} label="TSV-Core" size="sm" />
          </div>

          <DimRow dim={scores.core.functionalSpace} analystMode={analystMode} />
          <DimRow dim={scores.core.livability} analystMode={analystMode} />
          <DimRow dim={scores.core.ventilation} analystMode={analystMode} />
          <DimRow dim={scores.core.sunlight} analystMode={analystMode} />
          <DimRow dim={scores.core.view} analystMode={analystMode} />
          <DimRow dim={scores.core.vastu.score} analystMode={analystMode} />

          {analystMode && scores.core.vastu.score.available && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Vastu — Three Flavors</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Strict", score: scores.core.vastu.strict },
                  { label: "Moderate", score: scores.core.vastu.moderate },
                  { label: "Modern", score: scores.core.vastu.modern },
                ].map((v) => (
                  <div key={v.label} className="text-center">
                    <div className="text-xl font-bold font-serif text-forest">{v.score}</div>
                    <div className="text-xs text-gray-400">{v.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Building */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-forest">Building Infrastructure</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {scores.building.available ? "Based on provided building details" : "Not provided — add building details to unlock"}
              </p>
            </div>
            {scores.building.available
              ? <ScoreGauge score={scores.building.total} label="TSV-Building" size="sm" />
              : <span className="text-xs text-gray-300 border border-gray-200 px-3 py-1.5 rounded-full">Not provided</span>
            }
          </div>

          <DimRow dim={scores.building.amenityUtility} analystMode={analystMode} />
          <DimRow dim={scores.building.parking} analystMode={analystMode} />
          <DimRow dim={scores.building.waterAndPower} analystMode={analystMode} />
          <DimRow dim={scores.building.fireSafety} analystMode={analystMode} />
          <DimRow dim={scores.building.elevators} analystMode={analystMode} />
          <DimRow dim={scores.building.security} analystMode={analystMode} />
        </div>

        {/* Price / Value */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-serif font-bold text-forest">Price & Value</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {scores.value.available ? "Based on asking price vs city benchmark" : "Not provided — add asking price to unlock"}
              </p>
            </div>
            {scores.value.available
              ? <ScoreGauge score={scores.value.total} label="TSV-Value" size="sm" />
              : <span className="text-xs text-gray-300 border border-gray-200 px-3 py-1.5 rounded-full">Not provided</span>
            }
          </div>

          {scores.value.available ? (
            <>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-serif text-forest">₹{scores.value.pricePerSqFt.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">Asking / sqft</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold font-serif text-gray-600">₹{scores.value.cityBenchmarkPrice.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">City benchmark</div>
                </div>
                <div className={`rounded-xl p-4 text-center ${scores.value.pricePremiumPercent > 10 ? "bg-red-50" : scores.value.pricePremiumPercent < -5 ? "bg-green-50" : "bg-amber-50"}`}>
                  <div className={`text-2xl font-bold font-serif ${scores.value.pricePremiumPercent > 10 ? "text-red-700" : scores.value.pricePremiumPercent < -5 ? "text-green-700" : "text-amber-700"}`}>
                    {scores.value.pricePremiumPercent > 0 ? "+" : ""}{scores.value.pricePremiumPercent}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">vs benchmark</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">Value Rating</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                  r.valueRating === "Undervalued" ? "bg-green-100 text-green-800"
                  : r.valueRating === "Fair Value" ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
                }`}>
                  {r.valueRating}
                </span>
              </div>
              {analystMode && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 font-mono border border-gray-100">
                  TSV-Value = (Core {scores.core.total} × 0.70) + (Price Competitiveness {scores.value.priceCompetitivenessScore} × 0.30) = {scores.value.total}
                </div>
              )}
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Add the asking price per sq ft to get a value-for-money rating vs city benchmarks.</p>
              <Link href="/rate" className="text-sm text-gold-dark hover:underline font-semibold">Add price → Re-rate</Link>
            </div>
          )}
        </div>

        {/* Buyer Suitability — only if full data available */}
        {r.buyerSuitability && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-serif font-bold text-forest mb-4">Who Is This Apartment Best For?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {(["endUser", "investor", "nri"] as const).map((key) => {
                const labels = { endUser: "End-User / Self-Use", investor: "Investor / Rental", nri: "NRI Buyer" };
                const suit = r.buyerSuitability![key];
                return (
                  <div key={key} className={`rounded-xl p-4 ${ratingColor[suit.rating] ?? "bg-gray-50"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{ratingIcon[suit.rating]}</span>
                      <span className="text-sm font-bold">{suit.rating}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{labels[key]}</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{suit.reason}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        {(r.strengths.length > 0 || r.weaknesses.length > 0) && (
          <div className="grid md:grid-cols-2 gap-4">
            {r.strengths.length > 0 && (
              <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-serif font-bold text-green-800 mb-3">Strengths</h2>
                <ol className="space-y-1.5">
                  {r.strengths.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="text-green-500 font-bold shrink-0">{i + 1}.</span>{s}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {r.weaknesses.length > 0 && (
              <div className="bg-white border border-red-100 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-serif font-bold text-red-800 mb-3">Weaknesses</h2>
                <ol className="space-y-1.5">
                  {r.weaknesses.map((w, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="text-red-400 font-bold shrink-0">{i + 1}.</span>{w}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Enhance your score CTA */}
        {completeness.completenessPercent < 80 && (
          <div className="bg-forest text-sand rounded-2xl p-6">
            <h2 className="font-serif font-bold text-lg mb-2">Enhance Your Score</h2>
            <p className="text-sand/70 text-sm mb-4">
              {scores.core.availableDimensionCount}/6 core dimensions scored.
              Add the missing details to get your complete TSV report with building quality, price value, and buyer suitability.
            </p>
            <div className="flex flex-wrap gap-2 mb-5">
              {!completeness.hasOrientation && <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full">+ Facing direction</span>}
              {!completeness.hasView && <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full">+ View type</span>}
              {!completeness.hasVastu && <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full">+ Vastu directions</span>}
              {!completeness.hasBuilding && <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full">+ Building details</span>}
              {!completeness.hasPrice && <span className="text-xs bg-white/10 px-3 py-1.5 rounded-full">+ Asking price</span>}
            </div>
            <Link
              href="/rate"
              className="inline-block bg-gold text-forest font-bold text-sm px-6 py-3 rounded-xl hover:bg-gold-light transition-colors"
            >
              Add Details & Re-Rate →
            </Link>
          </div>
        )}

        {/* Analyst formula */}
        {analystMode && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Analyst Data</h2>
            <div className="grid md:grid-cols-2 gap-4 text-xs font-mono text-gray-600">
              <div>
                <p className="font-semibold text-gray-700 mb-1 font-sans">Composite (available layers only)</p>
                <p>Core {scores.core.total} ({scores.core.availableDimensionCount}/6 dims)</p>
                {scores.building.available && <p>Building {scores.building.total}</p>}
                {scores.value.available && <p>Value {scores.value.total}</p>}
                <p className="border-t border-gray-300 mt-1 pt-1 font-bold">Composite = {scores.composite}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1 font-sans">Key Inputs</p>
                <p>Carpet: {input.carpetArea ?? "?"} sqft | Beds: {input.bedrooms ?? "?"}</p>
                <p>Facing: {input.facing ?? "?"} | Floor: {input.floorNumber ?? "?"}</p>
                <p>Completeness: {completeness.completenessPercent}%</p>
                <p>ID: {report.id.slice(0, 12)}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="grid md:grid-cols-3 gap-3 print:hidden">
          <Link href="/rate" className="text-center py-3 px-4 bg-forest text-sand rounded-xl text-sm font-semibold hover:bg-forest/90 transition-colors">
            Rate Another
          </Link>
          <Link href={`/compare?ids=${report.id}`} className="text-center py-3 px-4 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-gold hover:text-gold-dark transition-colors">
            Compare
          </Link>
          <Link href="/explore" className="text-center py-3 px-4 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:border-gold hover:text-gold-dark transition-colors">
            Browse All
          </Link>
        </div>

        <p className="text-xs text-gray-300 text-center pb-8">
          TSV is an advisory quality index, not a statutory valuation. Methodology v1.0 · {new Date(report.ts).toLocaleDateString("en-IN")} · {report.id.slice(0, 12)}
        </p>
      </div>
    </div>
  );
}
