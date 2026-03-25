import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import { isAdmin } from "@/lib/is-admin";
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
  const userIsAdmin = await isAdmin(user.email ?? undefined);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--foreground)" }}>
      {/* Background glows — subtle in both modes */}
      <div className="fixed top-0 right-0 w-[700px] h-[600px] pointer-events-none opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(ellipse at top right, rgba(124,58,237,0.05), transparent 70%)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] pointer-events-none opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(ellipse at bottom left, rgba(59,130,246,0.04), transparent 70%)" }} />

      <DashboardShell
        profile={profile}
        certificates={certificates}
        appUrl={appUrl}
        initials={initials}
        userIsAdmin={userIsAdmin}
      />
    </div>
  );
}
