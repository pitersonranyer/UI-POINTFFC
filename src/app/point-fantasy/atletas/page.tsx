import { publicMetadata } from "@/lib/seo";
import Link from "next/link";
import { FantasyAthleteCatalog } from "@/components/point-fantasy/athletes/FantasyAthleteCatalog";
import styles from "@/components/point-fantasy/athletes/FantasyAthleteCatalog.module.css";

export const metadata = publicMetadata("POINT FFC FANTASY | Catálogo de atletas", "Conheça os atletas, clubes, categorias e valores virtuais em POINTCOINS do POINT FFC Fantasy.", "/point-fantasy/atletas/");
export default function FantasyAthletesPage() {
  return <div className="page-shell"><header className={styles.hero}><p className="eyebrow">O próximo capítulo do seu jogo</p><h1>POINT FFC FANTASY</h1><p>A estratégia escala. O Mago surpreende!</p></header><p><Link href="/point-fantasy/escalacoes/">Monte sua escalação →</Link></p><FantasyAthleteCatalog /></div>;
}
