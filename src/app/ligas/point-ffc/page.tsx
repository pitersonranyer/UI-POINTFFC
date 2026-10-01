import { PointLeaguePage } from "@/components/leagues/PointLeaguePage";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("Liga POINT FFC | Competições da rodada", "Confira as competições da liga POINT FFC, inscrições, premiações e resultados da rodada.", "/ligas/point-ffc/");
export default function Page() { return <PointLeaguePage />; }
