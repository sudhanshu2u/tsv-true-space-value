"use client";
import { useState } from "react";

interface ScoreDimensionProps {
  label: string;
  score: number;
  plainEnglish: string;
  analystNote?: string;
  percentileRank?: number;
  showAnalyst?: boolean;
}

const barColor = (score: number) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 50) return "bg-amber-500";
  if (score >= 35) return "bg-orange-500";
  return "bg-red-500";
};

const badgeStyle = (score: number) => {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 65) return "bg-blue-100 text-blue-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  if (score >= 35) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

export default function ScoreDimension({
  label,
  score,
  plainEnglish,
  analystNote,
  percentileRank,
  showAnalyst = false,
}: ScoreDimensionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          {percentileRank !== undefined && (
            <span className="text-[10px] text-gray-400 font-sans">
              {percentileRank}th percentile
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeStyle(score)}`}>
            {score}/100
          </span>
          {analystNote && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline"
            >
              {expanded ? "less" : "details"}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full ${barColor(score)}`}
          style={{ width: `${score}%`, transition: "width 0.6s ease-out" }}
        />
      </div>

      {/* Consumer plain English */}
      <p className="text-xs text-gray-500 leading-relaxed">{plainEnglish}</p>

      {/* Analyst note (expandable) */}
      {expanded && analystNote && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono leading-relaxed border-l-2 border-gold">
          {analystNote}
        </div>
      )}
    </div>
  );
}
