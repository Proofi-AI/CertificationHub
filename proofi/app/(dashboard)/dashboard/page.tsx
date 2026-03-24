import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureUserRecord(user);

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  const initials = (profile.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      {/* Fixed background blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <DashboardShell
        profile={profile}
        certificates={certificates}
        appUrl={appUrl}
        initials={initials}
      />
    </div>
  );
}
