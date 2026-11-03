import { notFound } from "next/navigation";
import { MatchCenterPage } from "@/components/fantasy/MatchCenterPage";
export const dynamicParams = false;
export function generateStaticParams() { return [{ fixtureId: "321" }]; }
export default function FantasyMatchRoute({ params }: { params: { fixtureId: string } }) {
  if (params.fixtureId !== "321") notFound();
  return <MatchCenterPage fixtureId={params.fixtureId} />;
}
