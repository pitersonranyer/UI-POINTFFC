import Link from "next/link";

export default function NotFound() {
  return <div className="page-shell"><p className="eyebrow">404</p><h1 className="page-title">Liga não encontrada</h1><p className="page-subtitle">Esta liga não existe ou não está mais disponível.</p><p><Link href="/ligas" style={{ color: "var(--orange)", fontWeight: 800 }}>Voltar para ligas</Link></p></div>;
}
