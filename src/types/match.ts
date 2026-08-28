export type RoundMatch = {
  id: number;
  home: { abbreviation: string; shieldUrl: string };
  away: { abbreviation: string; shieldUrl: string };
  date: string;
  venue: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type RoundMatches = { round: number; matches: RoundMatch[] };
