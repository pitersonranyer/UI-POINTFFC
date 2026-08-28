export enum LeagueEntryStatus { CONFIRMED = "CONFIRMED", CANCELLED = "CANCELLED" }

export type LeagueEntry = {
  id: string;
  leagueId: string;
  userId: string;
  userCartolaTeamId: string;
  createdAt: string;
  status: LeagueEntryStatus;
};
