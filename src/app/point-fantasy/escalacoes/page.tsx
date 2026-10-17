import React from "react";
import { publicMetadata, noIndexMetadata } from "@/lib/seo";
import { LegacyFantasyEntry } from "@/components/point-fantasy/showcase/LegacyFantasyEntry";

// Firebase serves the 301; this fallback also supports local/static preview servers.
export const metadata = { ...publicMetadata("POINT FFC Fantasy", "Acesse as competições do POINT FFC Fantasy.", "/point-fantasy"), ...noIndexMetadata };
export default function FantasyLineupPage() {
  return <LegacyFantasyEntry />;
}
