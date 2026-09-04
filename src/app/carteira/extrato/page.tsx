import { AuthGuard } from "@/components/auth/AuthGuard";
import { WalletStatement } from "@/components/wallet/WalletStatement";
export default function WalletStatementPage() { return <AuthGuard><WalletStatement /></AuthGuard>; }
