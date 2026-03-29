import Link from "next/link";
import Image from "next/image";
import type { User } from "@prisma/client";
import type { Certificate } from "@prisma/client";
import type { UserFeatures } from "@/lib/features";
import DashboardClient from "./DashboardClient";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "./ThemeToggle";
import FeedbackFAB from "@/components/feedback/FeedbackFAB";

interface Props {
  profile: User;
  certificates: Certificate[];
  appUrl?: string;
  initials: string;
  userIsAdmin?: boolean;
  globalFeatures: UserFeatures;
}

export default function DashboardShell({ profile, certificates, initials, userIsAdmin, globalFeatures }: Props) {
  const features = globalFeatures;

  return (
    <>
      <nav
        className="sticky top-0 z-20"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">

          {/* Logo + Beta */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center group transition-all duration-300 group-hover:scale-105">
              <Image src="/ProofiLogo.png" alt="Proofi AI" width={42} height={42} className="rounded-xl" />
            </Link>
            <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md
              text-violet-600 bg-violet-500/10 border border-violet-500/20
              dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20">
              beta
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-0.5 sm:gap-1">

            {/* View profile — hidden on mobile */}
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-3 py-2 rounded-xl
                text-slate-500 hover:text-slate-800 hover:bg-black/[0.06]
                dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              View Public Profile
            </Link>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Admin Link */}
            {userIsAdmin && (
              <Link
                href="/admin/feedback"
                className="flex items-center gap-1.5 text-xs font-bold transition-all duration-200 px-2 sm:px-3 py-2 rounded-xl
                  text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10
                  dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/20"
                title="Admin Feedback Inbox"
              >
                <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Admin Inbox</span>
              </Link>
            )}

            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-2 sm:px-3 py-2 rounded-xl
                text-slate-500 hover:text-slate-800 hover:bg-black/[0.06]
                dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08]"
              title="Settings"
            >
              <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {/* Divider — hidden on mobile */}
            <div className="hidden sm:block w-px h-5 mx-1" style={{ background: "var(--border)" }} />

            {/* Avatar */}
            <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0"
                style={{ boxShadow: "0 0 0 2px rgba(124,58,237,0.5), 0 0 0 4px rgba(124,58,237,0.1)" }}
              >
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    {initials}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium hidden md:block text-slate-600 dark:text-white/75">
                {profile.name}
              </span>
            </Link>

            <LogoutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <DashboardClient
          initialCertificates={certificates}
          features={features}
          profile={{
            avatarUrl: profile.avatarUrl,
            bio: profile.bio,
            slug: profile.slug,
            sortStrategy: profile.sortStrategy,
            profileViews: profile.profileViews,
            name: profile.name,
          }}
        />
      </div>

      {/* Floating Feedback Widget */}
      <FeedbackFAB />
    </>
  );
}
