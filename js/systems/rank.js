export const RANK_ORDER = ["E", "D", "C", "B", "A", "S"];

export const RANK_COLOR = {
  S: "#e8842e",
  A: "#b85c93",
  B: "#4a8fbf",
  C: "#4a8f4a",
  D: "#8a8aa0",
  E: "#6a6a7a",
};

export function getRank(species) {
  if (species.boss || (species.breedOnly && species.rare)) return "S";
  if (species.breedOnly) return "A";
  if (species.rare) return "B";
  if (species.recruitEase <= 0.12) return "C";
  if (species.recruitEase <= 0.20) return "D";
  return "E";
}
