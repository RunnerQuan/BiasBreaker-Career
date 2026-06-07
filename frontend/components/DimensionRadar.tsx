import type { AnalysisDimension } from "../lib/analysis";

type DimensionRadarProps = {
  dimensions: AnalysisDimension[];
};

const radarOrder: AnalysisDimension["key"][] = [
  "keywordCoverage",
  "structureClarity",
  "evidenceStrength",
  "atsReadability"
];

const displayLabels: Record<AnalysisDimension["key"], string> = {
  keywordCoverage: "关键词覆盖",
  structureClarity: "结构清晰度",
  evidenceStrength: "经历证据",
  atsReadability: "系统可读性"
};

export function DimensionRadar({ dimensions }: DimensionRadarProps) {
  const scores = radarOrder.map((key) => dimensions.find((item) => item.key === key)?.score ?? 0);
  const points = scores.map((score, index) => radarPoint(index, score)).join(" ");

  return (
    <div className="report-radar-card" aria-label="四项维度评分雷达图">
      <svg viewBox="0 0 280 280" role="img">
        <g fill="none" stroke="#cbd5e1" strokeWidth="1.2">
          <path d="M140 44 L226 140 L140 226 L54 140 Z" />
          <path d="M140 70 L200 140 L140 200 L80 140 Z" />
          <path d="M140 96 L174 140 L140 174 L106 140 Z" />
          <path d="M140 44 V226 M54 140 H226" strokeDasharray="3 5" />
        </g>
        <polygon points={points} fill="rgba(85, 200, 207, 0.28)" stroke="#18a8b5" strokeWidth="4" />
        {scores.map((score, index) => {
          const [x, y] = radarPoint(index, score).split(",").map(Number);
          return <circle key={radarOrder[index]} cx={x} cy={y} r="5" fill="#17b8c3" stroke="white" strokeWidth="2" />;
        })}

        <RadarLabel x={140} y={14} anchor="middle" label={displayLabels.keywordCoverage} score={scores[0]} />
        <RadarLabel x={262} y={132} anchor="middle" label={displayLabels.structureClarity} score={scores[1]} />
        <RadarLabel x={140} y={258} anchor="middle" label={displayLabels.evidenceStrength} score={scores[2]} />
        <RadarLabel x={18} y={132} anchor="middle" label={displayLabels.atsReadability} score={scores[3]} />
      </svg>
    </div>
  );
}

function radarPoint(index: number, score: number) {
  const center = 140;
  const radius = Math.max(0, Math.min(100, score)) * 0.86;
  if (index === 0) return `${center},${center - radius}`;
  if (index === 1) return `${center + radius},${center}`;
  if (index === 2) return `${center},${center + radius}`;
  return `${center - radius},${center}`;
}

function RadarLabel({ x, y, anchor, label, score }: { x: number; y: number; anchor: "middle"; label: string; score: number }) {
  return (
    <>
      <text x={x} y={y} textAnchor={anchor} className="report-radar-label">
        {label}
      </text>
      <text x={x} y={y + 20} textAnchor={anchor} className="report-radar-value">
        {score}
      </text>
    </>
  );
}
