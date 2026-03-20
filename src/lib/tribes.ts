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

export const TRIBE_SECTOR_ANGLE = 360 / TRIBES.length;
export const QUOTA_PER_TRIBE = 5;
export const ROUND_SIZE = QUOTA_PER_TRIBE * TRIBES.length;

export function getTribeById(id: TribeId) {
  return TRIBES.find((t) => t.id === id)!;
}

