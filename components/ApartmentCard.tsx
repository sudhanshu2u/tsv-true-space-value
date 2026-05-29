"use client";
import Link from "next/link";
import type { TSVIndexEntry } from "@/lib/tsv/types";
import { CITY_LABELS } from "@/lib/tsv/types";

interface ApartmentCardProps {
  entry: TSVIndexEntry;
  compareMode?: boolean;
  selected?: boolean;
  onToggleCompare?: (id: string) => void;
}

const verdictColor: Record<string, string> = {
  Excellent: "bg-green-100 text-green-800 border-green-200",
  "Great Buy": "bg-green-100 text-green-800 border-green-200",
  Good: "bg-blue-100 text-blue-800 border-blue-200",
  Fair: "bg-amber-100 text-amber-800 border-amber-200",
  Caution: "bg-orange-100 text-orange-800 border-orange-200",
  Avoid: "bg-red-100 text-red-800 border-red-200",
};

const scoreDot = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
};

export default function ApartmentCard({
  entry,
  compareMode = false,
  selected = false,
  onToggleCompare,
}: ApartmentCardProps) {
  const cityLabel = entry.city ? (CITY_LABELS[entry.city] ?? entry.city) : "";
  const vc = verdictColor[entry.verdictLabel] ?? verdictColor["Fair"];

  return (
    <div
      className={`group relative rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
        selected ? "ring-2 ring-gold" : ""
      }`}
    >
      {/* Score bar accent top */}
      <div
        className={`h-1 ${scoreDot(entry.composite)} w-full`}
        style={{ width: "100%" }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-forest text-sm leading-tight truncate">
              {entry.projectName}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">
              {entry.developerName} · {entry.unitType}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {entry.locality}, {cityLabel}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border ${vc}`}>
            {entry.verdictLabel}
          </span>
        </div>

        {/* Score chips */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className={`text-lg font-bold font-serif ${entry.composite >= 75 ? "text-green-700" : entry.composite >= 55 ? "text-amber-700" : "text-red-700"}`}>
              {entry.composite}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Composite</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold font-serif text-gray-700">{entry.coreScore}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Core</div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
            <div className="text-base font-bold font-serif text-gray-700">{entry.buildingScore}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Building</div>
          </div>
        </div>

        {/* Price + value rating */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500">
            {entry.askingPricePerSqFt ? `₹${entry.askingPricePerSqFt.toLocaleString()}/sqft` : "Price N/A"}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            entry.valueRating === "Undervalued"
              ? "bg-green-50 text-green-700"
              : entry.valueRating === "Fair Value"
                ? "bg-gray-100 text-gray-600"
                : "bg-red-50 text-red-700"
          }`}>
            {entry.valueRating}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/tsv/report/${entry.id}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-forest text-sand hover:bg-forest/90 transition-colors"
          >
            View Report
          </Link>
          {compareMode && (
            <button
              onClick={() => onToggleCompare?.(entry.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                selected
                  ? "bg-gold text-white border-gold"
                  : "border-gray-200 text-gray-600 hover:border-gold hover:text-gold-dark"
              }`}
            >
              {selected ? "✓" : "+"}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[10px] text-gray-300">
          {new Date(entry.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
