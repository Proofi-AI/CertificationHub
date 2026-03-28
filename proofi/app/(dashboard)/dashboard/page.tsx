import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import { isAdmin } from "@/lib/is-admin";
import { scoreCertificate } from "@/lib/certStrength";
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

  // Apply the user's saved sortStrategy so initialCertificates arrive pre-sorted
  const sortStrategy = profile.sortStrategy ?? "recent";
  switch (sortStrategy) {
    case "alphabetical":
      certificates.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "custom":
      certificates.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
      break;
    case "domain":
      certificates.sort((a, b) => {
        const dc = a.domain.localeCompare(b.domain);
        return dc !== 0 ? dc : new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
      break;
    case "strongest":
      certificates.sort((a, b) => scoreCertificate(b).score - scoreCertificate(a).score);
      break;
    case "expiring":
      certificates.sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      });
      break;
    // "recent" is already handled by orderBy: { issuedAt: "desc" } above
  }

  const initials = (profile.name || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
        initials={initials}
        userIsAdmin={userIsAdmin}
      />
    </div>
  );
}
