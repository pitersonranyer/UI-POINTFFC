import { CartolaDashboard } from "@/components/dashboard/CartolaDashboard";
import { publicMetadata, siteTitle, siteDescription } from "@/lib/seo";

export const metadata = publicMetadata(siteTitle, siteDescription, "/");
export default function Home() { return <CartolaDashboard />; }
