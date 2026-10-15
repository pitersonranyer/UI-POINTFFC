export type UniformPattern = "solid" | "horizontal" | "vertical" | "diagonal" | "chest";
export interface ClubUniform {
  id: number; name: string; abbreviation: string; primary: string; secondary: string;
  additional?: string; pattern: UniformPattern; text: string;
}
// IDs and abbreviations verified against the local Fantasy snapshot 2026/31/1.
export const clubUniforms: Record<number, ClubUniform> = Object.fromEntries([
  [262, "Flamengo", "FLA", "#c92332", "#17191c", "horizontal"],
  [263, "Botafogo", "BOT", "#17191c", "#ffffff", "vertical"],
  [264, "Corinthians", "COR", "#ffffff", "#17191c", "solid"],
  [265, "Bahia", "BAH", "#ffffff", "#1563b8", "vertical", "#d32c36"],
  [266, "Fluminense", "FLU", "#781f3a", "#17694d", "vertical", "#ffffff"],
  [267, "Vasco", "VAS", "#17191c", "#ffffff", "diagonal"],
  [275, "Palmeiras", "PAL", "#146340", "#ffffff", "solid"],
  [276, "São Paulo", "SAO", "#ffffff", "#d32c36", "chest", "#17191c"],
  [277, "Santos", "SAN", "#ffffff", "#17191c", "solid"],
  [280, "RB Bragantino", "RBB", "#ffffff", "#d32c36", "solid"],
  [282, "Atlético-MG", "CAM", "#17191c", "#ffffff", "vertical"],
  [283, "Cruzeiro", "CRU", "#1749a0", "#ffffff", "solid"],
  [284, "Grêmio", "GRE", "#3098d0", "#17191c", "vertical", "#ffffff"],
  [285, "Internacional", "INT", "#c92332", "#ffffff", "solid"],
  [287, "Vitória", "VIT", "#c92332", "#17191c", "horizontal"],
  [293, "Athletico-PR", "CAP", "#c92332", "#17191c", "diagonal"],
  [294, "Coritiba", "CFC", "#ffffff", "#146340", "chest"],
  [315, "Chapecoense", "CHA", "#16824d", "#ffffff", "solid"],
  [364, "Remo", "REM", "#18274d", "#ffffff", "solid"],
  [2305, "Mirassol", "MIR", "#f3ce36", "#217347", "solid"],
].map(([id, name, abbreviation, primary, secondary, pattern, additional]) => [id, {
  id, name, abbreviation, primary, secondary, pattern, additional, text: "#ffffff",
}])) as Record<number, ClubUniform>;
export function getClubUniform(id: number): ClubUniform {
  return clubUniforms[id] ?? { id, name: "Clube não configurado", abbreviation: "FFC", primary: "#737b85", secondary: "#e5e7eb", pattern: "solid", text: "#ffffff" };
}
