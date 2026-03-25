"use client";

import { useState } from "react";
import type { User } from "@prisma/client";
import { parseFeatures } from "@/lib/features";
import ProfilePanel from "./ProfilePanel";
import FeaturesPanel from "./FeaturesPanel";

type Tab = "profile" | "features";

interface Props {
  profile: User;
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  {
    id: "profile",
    label: "Profile",
    icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
  },
  {
    id: "features",
    label: "Features",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  },
];

const HEADINGS: Record<Tab, { title: string; subtitle: string }> = {
  profile: {
    title: "Profile settings",
    subtitle: "Manage your public profile and personal information",
  },
  features: {
    title: "Features",
    subtitle: "Enable or disable optional features for your account",
  },
};

export default function SettingsShell({ profile }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const features = parseFeatures(profile.features);
  const heading = HEADINGS[activeTab];

  return (
    <div>
      {/* Mobile tab bar — sits above everything, full bleed */}
      <div
        className="md:hidden flex mb-6 -mx-4 sm:-mx-6 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                isActive
                  ? "text-violet-600 dark:text-violet-400 border-violet-600 dark:border-violet-400"
                  : "text-slate-500 dark:text-white/50 border-transparent"
              }`}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Layout: sidebar (desktop) + panel */}
      <div className="flex gap-10">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-48 shrink-0 pt-1">
          <nav className="sticky top-24 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] px-3 mb-3 text-slate-400 dark:text-white/40">
              Account
            </p>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-left"
                  style={
                    isActive
                      ? {
                          color: "#7c3aed",
                          background: "rgba(124,58,237,0.08)",
                          border: "1px solid rgba(124,58,237,0.18)",
                        }
                      : {
                          color: "var(--muted)",
                          background: "transparent",
                          border: "1px solid transparent",
                        }
                  }
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panel */}
        <div className="flex-1 min-w-0">
          <div className="mb-6 sm:mb-7">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {heading.title}
            </h2>
            <p className="text-sm mt-1 text-slate-500 dark:text-white/55">{heading.subtitle}</p>
          </div>

          {activeTab === "profile" && <ProfilePanel initialProfile={profile} />}
          {activeTab === "features" && <FeaturesPanel initialFeatures={features} />}
        </div>
      </div>
    </div>
  );
}
