import { RoundCenter } from "@/components/round-center/RoundCenter";
import { round24Analysis } from "@/data/round-24-analysis";

export default function RoundCenterPage() {
  return <RoundCenter data={round24Analysis} />;
}
