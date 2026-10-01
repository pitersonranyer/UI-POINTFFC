import { LeaguesPage } from "@/components/leagues/LeaguesPage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Ligas | POINT FFC", "Conheça as ligas do POINT FFC e acompanhe os diferentes formatos de competição e rankings.", "/ligas/");

export default function Page() { return <LeaguesPage />; }
