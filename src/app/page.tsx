import { CartolaDashboard } from "@/components/dashboard/CartolaDashboard";
import { publicMetadata } from "@/lib/seo";

export const metadata = publicMetadata("POINT FFC | Fantasy Game de Futebol", "Conheça o POINT FFC, uma plataforma de fantasy futebol com ligas e competições. Consulte ferramentas do Cartola para planejar e acompanhar sua rodada.", "/");
export default function Home() { return <CartolaDashboard />; }
