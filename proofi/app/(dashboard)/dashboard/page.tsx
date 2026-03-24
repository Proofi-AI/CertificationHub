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
    <div className="min-h-screen text-[#f0f0f5]" style={{ background: "#04040a" }}>
      {/* Background glows */}
      <div className="fixed top-0 right-0 w-[700px] h-[600px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(124,58,237,0.05), transparent 70%)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom left, rgba(59,130,246,0.04), transparent 70%)" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(79,70,229,0.025), transparent 65%)" }} />

      <DashboardShell
        profile={profile}
        certificates={certificates}
        appUrl={appUrl}
        initials={initials}
      />
    </div>
  );
}
