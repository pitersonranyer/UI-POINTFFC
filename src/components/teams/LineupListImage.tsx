"use client";

import { useState } from "react";
import { escudoClube } from "@/lib/cartola";
import type { CartolaClub } from "@/types/cartola";

export function clubShirt(club: CartolaClub) {
  const shield = escudoClube(club);
  // Cartola uses the same season and club folders for shields and shirt silhouettes.
  return shield?.includes("/escudos/")
    ? shield.replace("/escudos/", "/silhuetas/").replace(/\/(30x30|45x45|60x60)\.png$/, "/140x140.png")
    : undefined;
}

export function LineupListImage({ photo, club, name }: { photo: string; club: CartolaClub; name: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  const shirt = clubShirt(club);
  const source = [photo, shirt].find((url): url is string => Boolean(url?.trim()) && !failed.includes(url!));
  if (!source) return <>{name.charAt(0)}</>;
  return <img src={source} alt="" style={source === shirt ? { objectFit: "contain", borderRadius: 0 } : undefined}
    onError={() => setFailed((urls) => [...urls, source])} />;
}
