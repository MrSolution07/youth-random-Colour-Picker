export type TribeId = "scarlet" | "skyline" | "sunfire" | "earth_bound";
export type ColorId = "red" | "blue" | "yellow" | "green";

export const TRIBES: Array<{
  id: TribeId;
  label: string;
  colorId: ColorId;
  colorLabel: string;
  hex: string;
}> = [
  {
    id: "scarlet",
    label: "Scarlet",
    colorId: "red",
    colorLabel: "Red",
    hex: "#ff3b30",
  },
  {
    id: "skyline",
    label: "Skyline",
    colorId: "blue",
    colorLabel: "Blue",
    hex: "#0a84ff",
  },
  {
    id: "sunfire",
    label: "Sunfire",
    colorId: "yellow",
    colorLabel: "Yellow",
    hex: "#ffd60a",
  },
  {
    id: "earth_bound",
    label: "Earth bound",
    colorId: "green",
    colorLabel: "Green",
    hex: "#34c759",
  },
];

export type WheelSegment = {
  tribeIndex: number;
  tribe: (typeof TRIBES)[number];
  kind: "color" | "tribe";
  displayLabel: string;
  hex: string;
  hexDark: string;
};

const DARK_HEX: Record<TribeId, string> = {
  scarlet: "#b8221a",
  skyline: "#065bb5",
  sunfire: "#b89a00",
  earth_bound: "#1f8a3a",
};

export function buildWheelSegments(): WheelSegment[] {
  const segments: WheelSegment[] = [];
  for (let i = 0; i < TRIBES.length; i++) {
    const t = TRIBES[i];
    segments.push({
      tribeIndex: i,
      tribe: t,
      kind: "color",
      displayLabel: t.colorLabel,
      hex: t.hex,
      hexDark: DARK_HEX[t.id],
    });
    segments.push({
      tribeIndex: i,
      tribe: t,
      kind: "tribe",
      displayLabel: t.label,
      hex: DARK_HEX[t.id],
      hexDark: t.hex,
    });
  }
  return segments;
}

export const WHEEL_SEGMENTS = buildWheelSegments();
export const SEGMENT_ANGLE = 360 / WHEEL_SEGMENTS.length;

export const TRIBE_SECTOR_ANGLE = 360 / TRIBES.length;
export const QUOTA_PER_TRIBE = 5;
export const ROUND_SIZE = QUOTA_PER_TRIBE * TRIBES.length;

export function getTribeById(id: TribeId) {
  return TRIBES.find((t) => t.id === id)!;
}
