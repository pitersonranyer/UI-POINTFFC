import type { Metadata } from "next";

// Domínio público documentado em docs/firebase-email-action.md.
export const siteUrl = "https://pointffc.com.br";
export const siteTitle = "POINT FFC | Fantasy Football Club";
export const siteDescription = "Jogos, ligas e inteligência para a sua rodada de fantasy football.";

export function publicMetadata(title: string, description: string, path?: string): Metadata {
  const url = path === undefined ? undefined : new URL(path, siteUrl).href;
  const images = [{ url: "/brand/pointffc-logo.png", width: 2172, height: 724, alt: "POINT FFC" }];
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: { title, description, ...(url ? { url } : {}), siteName: "POINT FFC", type: "website", locale: "pt_BR", images },
    twitter: { card: "summary_large_image", title, description, images: ["/brand/pointffc-logo.png"] },
  };
}

export const noIndexMetadata: Metadata = { robots: { index: false, follow: false } };
