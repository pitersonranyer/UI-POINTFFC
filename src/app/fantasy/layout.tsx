import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function FantasyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
