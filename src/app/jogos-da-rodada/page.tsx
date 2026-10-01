import { RoundGamesPage } from "@/components/matches/RoundGamesPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Jogos da rodada | POINT FFC", "Confira os jogos da rodada, horários, placares e detalhes das partidas.", "/jogos-da-rodada/");
export default function RoundGamesRoute() { return <RoundGamesPage />; }
