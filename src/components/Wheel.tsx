import { useMemo } from "react";
import { TRIBES, type TribeId, TRIBE_SECTOR_ANGLE } from "../lib/tribes";

type Props = {
  rotationDeg: number;
  highlight?: TribeId | null;
  spinning?: boolean;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function sectorPath(cx: number, cy: number, r0: number, r1: number, startDeg: number, endDeg: number) {
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  const start0 = polarToCartesian(cx, cy, r0, startDeg);
  const end0 = polarToCartesian(cx, cy, r0, endDeg);
  const start1 = polarToCartesian(cx, cy, r1, startDeg);
  const end1 = polarToCartesian(cx, cy, r1, endDeg);

  return [
    `M ${start0.x} ${start0.y}`,
    `L ${start1.x} ${start1.y}`,
    `A ${r1} ${r1} 0 ${largeArc} 1 ${end1.x} ${end1.y}`,
    `L ${end0.x} ${end0.y}`,
    `A ${r0} ${r0} 0 ${largeArc} 0 ${start0.x} ${start0.y}`,
    "Z",
  ].join(" ");
}

export default function Wheel({ rotationDeg, highlight, spinning }: Props) {
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const rInner = 92;
  const rOuter = 180;

  const sectors = useMemo(() => {
    return TRIBES.map((t, idx) => {
      // We align sector 0 to the top pointer at rotation=0.
      const start = idx * TRIBE_SECTOR_ANGLE;
      const end = (idx + 1) * TRIBE_SECTOR_ANGLE;
      const isHighlight = highlight === t.id;
      return {
        t,
        start,
        end,
        isHighlight,
      };
    });
  }, [highlight]);

  return (
    <div className="center" style={{ position: "relative" }}>
      {/* Pointer */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "14px solid transparent",
          borderRight: "14px solid transparent",
          borderBottom: "24px solid rgba(255,255,255,0.9)",
          filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.5))",
          zIndex: 5,
        }}
      />

      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            transform: `rotate(${rotationDeg}deg)`,
              transition: spinning
                ? "transform 2800ms cubic-bezier(0.13, 0.89, 0.22, 1)"
                : "transform 250ms ease",
            filter: "drop-shadow(0 24px 60px rgba(0,0,0,0.35))",
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <defs>
              <radialGradient id="rim" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                <stop offset="70%" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
              </radialGradient>
              <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Outer rim */}
            <circle
              cx={cx}
              cy={cy}
              r={rOuter + 14}
              fill="url(#rim)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={2}
            />

            {sectors.map(({ t, start, end, isHighlight }) => {
              const path = sectorPath(cx, cy, rInner, rOuter, start, end);
              const labelAngle = (start + end) / 2;
              const labelPos = polarToCartesian(cx, cy, (rInner + rOuter) / 2, labelAngle);
              return (
                <g key={t.id} filter={isHighlight ? "url(#softGlow)" : undefined}>
                  <path
                    d={path}
                    fill={t.hex}
                    stroke="rgba(255,255,255,0.26)"
                    strokeWidth={2}
                    opacity={isHighlight ? 1 : 0.96}
                  />
                  {/* Labels */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="rgba(255,255,255,0.95)"
                    fontSize={14}
                    fontWeight={800}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelAngle} ${labelPos.x} ${labelPos.y})`}
                    style={{
                      paintOrder: "stroke",
                      stroke: "rgba(0,0,0,0.25)",
                      strokeWidth: 2,
                    }}
                  >
                    {t.colorLabel.toUpperCase()}
                  </text>
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 20}
                    fill="rgba(255,255,255,0.95)"
                    fontSize={13}
                    fontWeight={700}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelAngle} ${labelPos.x} ${labelPos.y})`}
                    style={{
                      paintOrder: "stroke",
                      stroke: "rgba(0,0,0,0.25)",
                      strokeWidth: 2,
                    }}
                  >
                    {t.label}
                  </text>
                </g>
              );
            })}

            {/* Center icon */}
            <circle
              cx={cx}
              cy={cy}
              r={74}
              fill="rgba(0,0,0,0.25)"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth={2}
            />
            <image
              href="/acts-logo.png"
              x={cx - 46}
              y={cy - 46}
              width={92}
              height={92}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.95}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

