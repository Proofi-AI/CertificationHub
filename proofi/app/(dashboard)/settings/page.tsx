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
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      {/* Background blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <h1 className="font-semibold text-base">Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        <ProfilePanel initialProfile={profile} />
      </div>
    </div>
  );
}
