import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...noIndexMetadata,
  referrer: "no-referrer",
};

export default function TelegramLinkLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
