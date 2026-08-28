import { roundMatches } from "@/data/matches";
import type { RoundMatches } from "@/types/match";
export const matchService = { getCurrentRound: (): RoundMatches => roundMatches };
