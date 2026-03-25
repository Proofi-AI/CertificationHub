import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";
import SettingsShell from "@/components/dashboard/SettingsShell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ensureUserRecord(user);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--foreground)" }}>
      {/* Subtle background glow */}
      <div className="fixed top-0 right-0 w-[600px] h-[500px] pointer-events-none opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(ellipse at top right, rgba(124,58,237,0.05), transparent 70%)" }} />

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium transition-all duration-200 group text-slate-500 hover:text-slate-800 dark:text-white/55 dark:hover:text-white/80"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: "var(--hover-bg)", border: "1px solid var(--border)" }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </div>
            Back
          </Link>
          <div className="w-px h-5" style={{ background: "var(--border)" }} />
          <h1 className="text-sm font-bold tracking-tight text-slate-700 dark:text-white/90">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <SettingsShell profile={profile} />
      </div>
    </div>
  );
}
