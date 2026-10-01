import type { Metadata } from "next";
import { Suspense } from "react";
import { EmailActionLoading, EmailActionPage } from "@/components/auth/EmailActionPage";

export const metadata: Metadata = {
  title: "Segurança da conta | POINT FFC",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AuthActionPage() {
  return <Suspense fallback={<EmailActionLoading />}><EmailActionPage /></Suspense>;
}
