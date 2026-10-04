import { LeaguesPage } from "@/components/leagues/LeaguesPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Ligas do Cartola e Fantasy Futebol | POINT FFC", "Conheça as ligas do Cartola no POINT FFC e explore as competições de fantasy futebol disponíveis, seus formatos e rankings.", "/ligas/");

export default function Page() { return <LeaguesPage />; }
