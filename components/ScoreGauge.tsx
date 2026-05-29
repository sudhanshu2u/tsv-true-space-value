"use client";

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const COLOR_MAP = (score: number) => {
  if (score >= 80) return { stroke: "#16a34a", text: "text-green-700", bg: "bg-green-50" };
  if (score >= 65) return { stroke: "#2563eb", text: "text-blue-700", bg: "bg-blue-50" };
  if (score >= 50) return { stroke: "#d97706", text: "text-amber-700", bg: "bg-amber-50" };
  if (score >= 35) return { stroke: "#ea580c", text: "text-orange-700", bg: "bg-orange-50" };
  return { stroke: "#dc2626", text: "text-red-700", bg: "bg-red-50" };
};

export default function ScoreGauge({ score, label, size = "md", showLabel = true }: ScoreGaugeProps) {
  const { stroke, text } = COLOR_MAP(score);

  const sizes = {
    sm: { svgSize: 72, r: 28, sw: 5, fontSize: "text-lg", labelSize: "text-[10px]" },
    md: { svgSize: 100, r: 38, sw: 7, fontSize: "text-2xl", labelSize: "text-xs" },
    lg: { svgSize: 140, r: 54, sw: 9, fontSize: "text-4xl", labelSize: "text-sm" },
  };

  const { svgSize, r, sw, fontSize, labelSize } = sizes[size];
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const circumference = 2 * Math.PI * r;

  // Arc starts at -90° (top), goes 270° for the gauge arc
  const GAUGE_ANGLE = 270;
  const gaugeFraction = GAUGE_ANGLE / 360;
  const gaugeCircumference = circumference * gaugeFraction;
  const dashOffset = gaugeCircumference - (score / 100) * gaugeCircumference;

  // Rotation: start at 135° (bottom-left), sweep 270°
  const startAngle = 135;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={sw}
            strokeDasharray={`${gaugeCircumference} ${circumference - gaugeCircumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${cx} ${cy})`}
          />
          {/* Value arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            strokeDasharray={`${gaugeCircumference - dashOffset} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(${startAngle} ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
        </svg>
        {/* Score text centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold font-serif ${text} leading-none`}>{score}</span>
          <span className={`${labelSize} text-gray-400 font-sans leading-none mt-0.5`}>/100</span>
        </div>
      </div>
      {showLabel && (
        <span className={`${labelSize} font-sans font-medium text-gray-600 text-center uppercase tracking-wider`}>
          {label}
        </span>
      )}
    </div>
  );
}
