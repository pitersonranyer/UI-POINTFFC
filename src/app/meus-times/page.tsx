import { AuthGuard } from "@/components/auth/AuthGuard";
import { MyTeamsManager } from "@/components/teams/MyTeamsManager";

export default function MyTeamsPage() {
  return <AuthGuard><MyTeamsManager /></AuthGuard>;
}
