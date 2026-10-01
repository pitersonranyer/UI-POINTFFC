import { AthleteScoresPage } from "@/components/athletes/AthleteScoresPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Pontuação dos atletas | POINT FFC", "Acompanhe a pontuação dos atletas do Cartola e consulte seu desempenho na rodada.", "/pontuacao-atletas/");
export default function AthletesScoreRoute(){return <AthleteScoresPage/>}
