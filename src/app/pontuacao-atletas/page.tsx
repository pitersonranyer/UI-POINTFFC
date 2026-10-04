import { AthleteScoresPage } from "@/components/athletes/AthleteScoresPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Pontuação e Parciais do Cartola | POINT FFC", "Acompanhe a pontuação e as parciais dos atletas do Cartola durante a rodada. Consulte o desempenho dos jogadores no POINT FFC.", "/pontuacao-atletas/");
export default function AthletesScoreRoute(){return <AthleteScoresPage/>}
