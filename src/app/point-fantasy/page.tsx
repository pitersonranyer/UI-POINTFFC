import React from "react";
import { Trophy } from "lucide-react";
import { publicMetadata } from "@/lib/seo";
import { FantasyShowcase } from "@/components/point-fantasy/showcase/FantasyShowcase";
import styles from "@/components/point-fantasy/showcase/FantasyShowcase.module.css";

export const metadata = publicMetadata("POINT FFC Fantasy", "Encontre sua competição no POINT FFC Fantasy. Explore as disputas disponíveis, escolha onde participar e prepare sua escalação.", "/point-fantasy");

export default function PointFantasyPage() {
  return <div className="page-shell"><header className={styles.hero}><span className={styles.heroIcon}><Trophy size={25} aria-hidden="true" /></span><div><h1>POINT FFC Fantasy</h1><p>Sua estratégia. Seu time. Sua próxima conquista.</p></div></header><FantasyShowcase /></div>;
}
