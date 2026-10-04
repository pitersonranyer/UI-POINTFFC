import { RoundGamesPage } from "@/components/matches/RoundGamesPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Jogos da Rodada do Brasileirão | POINT FFC", "Confira os confrontos da rodada do Brasileirão, com horários, locais e placares disponíveis. Consulte os detalhes de cada partida no POINT FFC.", "/jogos-da-rodada/");
export default function RoundGamesRoute() { return <RoundGamesPage />; }
