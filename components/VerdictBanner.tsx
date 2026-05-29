"use client";
import ScoreGauge from "./ScoreGauge";

interface VerdictBannerProps {
  projectName: string;
  developerName: string;
  unitType: string;
  city: string;
  locality: string;
  composite: number;
  coreScore: number;
  buildingScore: number;
  valueScore: number;
  verdictLabel: string;
  valueRating?: "Undervalued" | "Fair Value" | "Overpriced";
  reportId: string;
}

const verdictStyles: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  Excellent: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", icon: "★" },
  "Great Buy": { bg: "bg-green-50", text: "text-green-800", border: "border-green-200", icon: "✓" },
  Good: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", icon: "◆" },
  Fair: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", icon: "◉" },
  Caution: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200", icon: "⚠" },
  Avoid: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200", icon: "✕" },
};

const valueRatingStyle: Record<string, string> = {
  Undervalued: "bg-green-100 text-green-800",
  "Fair Value": "bg-amber-100 text-amber-800",
  Overpriced: "bg-red-100 text-red-800",
};

export default function VerdictBanner({
  projectName,
  developerName,
  unitType,
  city,
  locality,
  composite,
  coreScore,
  buildingScore,
  valueScore,
  verdictLabel,
  valueRating,
  reportId,
}: VerdictBannerProps) {
  const style = verdictStyles[verdictLabel] ?? verdictStyles["Fair"];

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-6 md:p-8`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-forest">
              {projectName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {developerName} · {unitType} · {locality}, {city}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full border ${style.border} ${style.bg} ${style.text}`}>
              {style.icon} {verdictLabel}
            </span>
            {valueRating && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${valueRatingStyle[valueRating]}`}>
                {valueRating}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Three gauges */}
      <div className="grid grid-cols-3 gap-4 md:gap-8">
        <div className="flex flex-col items-center">
          <ScoreGauge score={composite} label="TSV Score" size="lg" />
          <p className="text-xs text-gray-500 text-center mt-2">Composite</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <ScoreGauge score={coreScore} label="Core Quality" size="md" />
          {buildingScore >= 0 ? (
            <ScoreGauge score={buildingScore} label="Building" size="md" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-[100px] h-[100px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-full">
                <span className="text-xs text-gray-300">N/A</span>
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Building</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center justify-center">
          {valueScore >= 0 ? (
            <ScoreGauge score={valueScore} label="Value" size="md" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <div className="w-[100px] h-[100px] flex items-center justify-center border-2 border-dashed border-gray-200 rounded-full">
                <span className="text-xs text-gray-300">N/A</span>
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Value</span>
            </div>
          )}
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Report ID</p>
            <p className="text-xs font-mono text-gray-500 mt-0.5">{reportId.slice(0, 8)}…</p>
          </div>
        </div>
      </div>

      {/* Share bar */}
      <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-gray-500">
          Shareable report — no login required to view
        </p>
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              navigator.clipboard?.writeText(window.location.href).catch(() => {});
            }
          }}
          className="text-xs text-gold-dark hover:underline font-medium"
        >
          Copy link ↗
        </button>
      </div>
    </div>
  );
}
