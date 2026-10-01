import type { Metadata } from "next";
import { publicMetadata, siteUrl, siteTitle, siteDescription } from "@/lib/seo";
import { Navigation } from "@/components/navigation/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...publicMetadata(siteTitle, siteDescription),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <WalletProvider>
            <Navigation />
            <main>{children}</main>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
