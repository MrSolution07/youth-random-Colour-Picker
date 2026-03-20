import { useMemo } from "react";
import { SEGMENT_ANGLE, WHEEL_SEGMENTS, type TribeId } from "../lib/tribes";

type Props = {
  rotationDeg: number;
  highlight?: TribeId | null;
  spinning?: boolean;
  result?: boolean;
  onSpin?: () => void;
  disabled?: boolean;
  buttonLabel?: string;
};

function rewardFontSize(label: string) {
  const l = label.replace(/\s+/g, " ").trim();
  if (l.length >= 13) return 13;
  if (l.length >= 10) return 15;
  return 18;
}

export default function Wheel({
  rotationDeg,
  highlight,
  spinning,
  result,
  onSpin,
  disabled,
  buttonLabel = "SPIN",
}: Props) {
  const segments = useMemo(() => {
    return WHEEL_SEGMENTS.map((seg, i) => {
      const angle = i * SEGMENT_ANGLE;
      const isWinner = seg.kind === "tribe" && highlight != null && seg.tribe.id === highlight;
      return { seg, i, angle, isWinner };
    });
  }, [highlight]);

  return (
    <div
      className={[
        "wheel-area",
        spinning ? "spinning exploding" : "",
        result ? "result" : "",
      ].join(" ")}
    >
      <div className="pointer" aria-hidden>
        <div className="pointer-dot" />
      </div>

      <div
        className="wheel-wrap"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
        }}
      >
        {segments.map(({ seg, i, angle, isWinner }) => {
          const isTribe = seg.kind === "tribe";
          const bg = isTribe
            ? "linear-gradient(145deg,#ffffff,#e8e8f0)"
            : `linear-gradient(145deg, ${seg.hexDark}, ${seg.hex})`;
          const textColor = isTribe ? "#4c1d95" : "rgba(255,255,255,0.95)";
          const fontSize = rewardFontSize(seg.displayLabel);

          return (
            <div
              key={`${seg.kind}-${seg.tribe.id}-${i}`}
              className={[
                "segment",
                isTribe ? "seg-white" : "seg-color",
                isWinner ? "winner" : "",
              ].join(" ")}
              style={{
                // Drives all segment transforms in CSS
                ["--angle" as any]: `${angle}deg`,
                background: bg,
              }}
            >
              <div className="reward-value" style={{ color: textColor, fontSize }}>
                {seg.displayLabel}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="center-btn"
        onClick={onSpin}
        disabled={disabled || spinning}
        aria-label="Spin"
      >
        <span className="btn-label">{buttonLabel}</span>
      </button>
    </div>
  );
}
