import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import ProfilePanel from "@/components/dashboard/ProfilePanel";
import CertificatesPanel from "@/components/dashboard/CertificatesPanel";
import LogoutButton from "@/components/LogoutButton";

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

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-base tracking-tight text-white/90">Proofi AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`${appUrl}/${profile.slug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors border border-white/8 hover:border-white/20 rounded-lg px-3 py-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View profile
            </Link>
            <div className="flex items-center gap-2">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                  {initials}
                </div>
              )}
              <span className="text-sm text-white/60 hidden sm:block">{profile.name}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar — Profile Panel */}
          <aside className="w-full lg:w-80 shrink-0">
            <ProfilePanel initialProfile={profile} />
          </aside>

          {/* Main — Certificates Panel */}
          <main className="flex-1 min-w-0">
            <CertificatesPanel initialCertificates={certificates} />
          </main>
        </div>
      </div>
    </div>
  );
}
