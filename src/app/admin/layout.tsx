import { AdminShell } from "@/components/admin/AdminShell";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = noIndexMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) { return <AdminShell>{children}</AdminShell>; }
