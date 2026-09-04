import { AuthGuard } from "@/components/auth/AuthGuard";
import { ProfileDashboard } from "@/components/profile/ProfileDashboard";
export default function ProfilePage() { return <AuthGuard><ProfileDashboard /></AuthGuard>; }
