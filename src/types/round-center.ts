export type SquadTier = 1 | 2 | 3;

export type RoundTeamAnalysis = {
  team: string;
  tier: SquadTier;
  cleanSheetProbability?: number;
  xG?: number;
  xGA?: number;
  offensiveStrength?: number;
  defensiveStrength?: number;
};

export type RoundMatchAnalysis = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  imaginedScore?: { home: number; away: number };
  metrics?: { homeXG?: number; awayXG?: number; homeXGA?: number; awayXGA?: number };
};

export type RoundCenterDataset = {
  round: number;
  competition: string;
  matches: RoundMatchAnalysis[];
  cleanSheetAnalysis: RoundTeamAnalysis[];
};
