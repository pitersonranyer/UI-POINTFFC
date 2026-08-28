export type PrizeTier = {
  position: string;
  value: string;
};

export enum LeagueStatus { OPEN = "OPEN", CLOSED = "CLOSED", LIVE = "LIVE", FINISHED = "FINISHED" }

export type League = {
  id: string;
  name: string;
  category: string;
  organizerId: string;
  entryFee: number;
  prizePool: number;
  currentParticipants: number;
  maxParticipants: number;
  maxTeamsPerUser: number | null;
  marketCloseDate: string;
  status: LeagueStatus;
  platformFeePercentage: number;
  organizer: string;
  description: string;
  rules: string[];
  prizeDistribution: PrizeTier[];
  featured?: boolean;
};
