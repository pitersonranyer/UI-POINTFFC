import { leagueEntries } from "@/data/league-entries";
import { LeagueEntryStatus, type LeagueEntry } from "@/types/league-entry";
export const leagueEntryService = {
  getByLeagueAndUser: (leagueId: string, userId: string): LeagueEntry[] => leagueEntries.filter((entry) => entry.leagueId === leagueId && entry.userId === userId && entry.status === LeagueEntryStatus.CONFIRMED),
  createMockEntries: (leagueId: string, userId: string, teamIds: string[]): LeagueEntry[] => teamIds.map((teamId, index) => ({ id: `mock-${leagueId}-${teamId}-${index}`, leagueId, userId, userCartolaTeamId: teamId, createdAt: new Date().toISOString(), status: LeagueEntryStatus.CONFIRMED })),
};
