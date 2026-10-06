import { notFound } from "next/navigation";
import { MatchCenterPage } from "@/components/fantasy/MatchCenterPage";
import { lineupExamples, matchCenterMock } from "@/mocks/fantasy/fixture1180729";

export const dynamicParams = false;
export function generateStaticParams() {
  return [{ fixtureId: "1180729" }];
}

export default function FantasyMatchRoute({ params }: { params: { fixtureId: string } }) {
  if (params.fixtureId !== "1180729") notFound();
  // Explicit mock composition root. Replace here when backend integration is approved.
  return <MatchCenterPage sections={matchCenterMock} examples={lineupExamples} />;
}
