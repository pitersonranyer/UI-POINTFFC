import { LeagueStatus, type League } from "@/types/league";

const defaults = {
  organizerId: "organizer-platform",
  organizer: "POINT FFC",
  maxParticipants: 2000,
  maxTeamsPerUser: null,
  status: LeagueStatus.OPEN,
  platformFeePercentage: 10,
  description: "Uma disputa rápida para quem confia no seu time. Entre, acompanhe a rodada e concorra aos prêmios.",
  rules: [
    "Vale a pontuação oficial da rodada do fantasy.",
    "Cada time pode participar uma vez nesta liga.",
    "Empates serão decididos pelos critérios oficiais da plataforma.",
  ],
  prizeDistribution: [
    { position: "1º lugar", value: "50%" },
    { position: "2º lugar", value: "30%" },
    { position: "3º lugar", value: "20%" },
  ],
};

export const leagues: League[] = [
  { id: "point-do-jogador", name: "POINT FFC", category: "Tiro Curto", entryFee: 10, currentParticipants: 750, prizePool: 5000, marketCloseDate: "21/08 às 20:00", featured: true, ...defaults },
  { id: "liga-do-barao", name: "Liga do Barão", category: "Elite", entryFee: 50, currentParticipants: 180, prizePool: 7000, marketCloseDate: "21/08 às 19:30", ...defaults, organizerId: "organizer-barao", organizer: "@baraofc" },
  { id: "liga-dos-patroes", name: "Liga dos Patrões", category: "Premium", entryFee: 20, currentParticipants: 190, prizePool: 3000, marketCloseDate: "21/08 às 19:40", ...defaults },
  { id: "liga-da-galera", name: "Liga da Galera", category: "Popular", entryFee: 5, currentParticipants: 620, prizePool: 2000, marketCloseDate: "21/08 às 20:00", ...defaults },
  { id: "so-craque", name: "Liga Só Craques", category: "Popular", entryFee: 3, currentParticipants: 480, prizePool: 900, marketCloseDate: "21/08 às 20:00", ...defaults },
  { id: "cartoleiro-raiz", name: "Liga Cartoleiro Raiz", category: "Raiz", entryFee: 2, currentParticipants: 710, prizePool: 800, marketCloseDate: "21/08 às 20:00", ...defaults },
  { id: "liga-do-real", name: "Liga do Real", category: "Entrada", entryFee: 1, currentParticipants: 950, prizePool: 600, marketCloseDate: "21/08 às 20:00", ...defaults },
];

export const featuredLeague = leagues.find((league) => league.featured)!;
export const openLeagues = leagues.filter((league) => !league.featured);

export function getLeagueById(id: string) {
  return leagues.find((league) => league.id === id);
}
