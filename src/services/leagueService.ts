import { leagues } from "@/data/leagues";
import { LeagueStatus, type League } from "@/types/league";
export const leagueService = {
  getAll: (): League[] => leagues,
  getOpen: (): League[] => leagues.filter((league) => league.status === LeagueStatus.OPEN),
  getFeatured: (): League | undefined => leagues.find((league) => league.featured),
  getById: (id: string): League | undefined => leagues.find((league) => league.id === id),
};
