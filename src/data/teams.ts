import type { UserCartolaTeam } from "@/types/team";

const teamNames = [
  "Real Prime CFC", "Real Prime CFC 02", "Chute de Ouro C01", "Chute de Ouro C02", "Chute de Ouro C03", "Tropa do Point",
  "Resenha de Domingo", "Só Camisa 10", "Cartoleiro Raiz", "Futebol Arte", "Bola na Rede", "Galáticos FC",
  "Caneta & Gol", "Rei da Rodada", "Vila Fantasy", "Camisa Pesada", "Seleção do Point", "Resenha FC",
  "Os Patrões", "Barão FC", "Futebol de Quinta", "Tática Perfeita", "Só no Talento", "Muralha FC",
];

export const teams: UserCartolaTeam[] = teamNames.map((name, index) => ({
  id: `team-${index + 1}`, userId: "user-player-1", cartolaTeamId: 10000 + index, name, ownerName: "Piterson",
  slug: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  shieldUrl: "", active: true, linkedAt: new Date(2026, 7, 1, 12, index).toISOString(),
}));
