import { RoundGamesPage } from "@/components/matches/RoundGamesPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Agenda do Brasileirão Série A 2026 | POINT FFC", "Acompanhe a agenda do Brasileirão Série A 2026 por rodada, com horários de Brasília, placares e acesso à Central da Partida no POINT FFC.", "/jogos-da-rodada/");
export default function RoundGamesRoute() { return <RoundGamesPage />; }
