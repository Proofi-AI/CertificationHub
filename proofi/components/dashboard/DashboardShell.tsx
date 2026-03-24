"use client";

import { useState } from "react";
import Link from "next/link";
import type { User } from "@prisma/client";
import type { Certificate } from "@prisma/client";
import CertificatesPanel from "./CertificatesPanel";
import SettingsModal from "./SettingsModal";
import LogoutButton from "@/components/LogoutButton";

interface Props {
  profile: User;
  certificates: Certificate[];
  appUrl: string;
  initials: string;
}

export default function DashboardShell({ profile, certificates, appUrl, initials }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
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

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors border border-white/8 hover:border-white/20 rounded-lg px-3 py-1.5"
              title="Settings"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Settings</span>
            </button>

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

      {/* Full-width content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <CertificatesPanel initialCertificates={certificates} />
      </div>

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsModal
          initialProfile={profile}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
