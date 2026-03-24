import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import ProfilePanel from "@/components/dashboard/ProfilePanel";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureUserRecord(user);

  return (
    <div className="min-h-screen text-[#f0f0f5]" style={{ background: "#04040a" }}>

      {/* Background glow */}
      <div className="fixed top-0 right-0 w-[700px] h-[500px] pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, rgba(124,58,237,0.05), transparent 70%)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[400px] pointer-events-none" style={{ background: "radial-gradient(ellipse at bottom left, rgba(59,130,246,0.04), transparent 70%)" }} />

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(4,4,10,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-white/35 hover:text-white/80 transition-all duration-200 group"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.05] group-hover:bg-white/[0.09] border border-white/[0.07] transition-all">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </div>
            Back
          </Link>
          <div className="w-px h-5 bg-white/[0.08]" />
          <h1 className="text-sm font-bold text-white/80 tracking-tight">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex gap-10">

          {/* Left sidebar nav */}
          <div className="hidden md:block w-48 shrink-0 pt-1">
            <nav className="sticky top-24 space-y-1">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.14em] px-3 mb-3">Account</p>
              <a
                href="#profile"
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  color: "rgba(167,139,250,1)",
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Profile
              </a>
            </nav>
          </div>

          {/* Main content */}
          <div id="profile" className="flex-1 min-w-0">
            <div className="mb-7">
              <h2 className="text-xl font-black text-white tracking-tight">Profile settings</h2>
              <p className="text-sm text-white/35 mt-1">Manage your public profile and personal information</p>
            </div>
            <ProfilePanel initialProfile={profile} />
          </div>

        </div>
      </div>
    </div>
  );
}
