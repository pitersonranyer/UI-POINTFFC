import type { Metadata } from "next";
import { Navigation } from "@/components/navigation/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { WalletProvider } from "@/contexts/WalletContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "POINT FFC | Fantasy Football Club",
  description: "Jogos, ligas e inteligência para a sua rodada de fantasy football.",
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
