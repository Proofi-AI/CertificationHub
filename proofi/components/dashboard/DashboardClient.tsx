"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Badge, Certificate, User } from "@prisma/client";
import type { UserFeatures } from "@/lib/features";
import CertificatesPanel from "./CertificatesPanel";
import BadgesPanel from "./BadgesPanel";
import ActivityPanel from "./ActivityPanel";
import DashboardTabs from "./DashboardTabs";

interface Props {
  initialCertificates: Certificate[];
  initialBadges: Badge[];
  features: UserFeatures;
  profile: Pick<User, "avatarUrl" | "bio" | "slug" | "sortStrategy" | "profileViews" | "name"> & { badgeSortStrategy?: string };
}

export default function DashboardClient({ initialCertificates, initialBadges, features, profile }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"certificates" | "badges">(
    rawTab === "badges" ? "badges" : "certificates"
  );
  const [contentVisible, setContentVisible] = useState(true);

  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [externalEdit, setExternalEdit] = useState<Certificate | null>(null);

  const handleTabChange = (tab: "certificates" | "badges") => {
    if (tab === activeTab) return;
    setContentVisible(false);
    setTimeout(() => {
      setActiveTab(tab);
      setContentVisible(true);
      // Scroll to top on mobile
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 150);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Sync tab from URL if it changes externally
  useEffect(() => {
    const t = searchParams.get("tab");
    const resolved = t === "badges" ? "badges" : "certificates";
    if (resolved !== activeTab) {
      setActiveTab(resolved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* Left: main content (75%) */}
      <div className="w-full lg:flex-[0_0_75%] lg:min-w-0 space-y-6" id="main-panel">

        {/* Tab bar */}
        <div style={{ borderBottom: "1px solid var(--border)" }}>
          <DashboardTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            badgeCount={badges.length}
            certificateCount={certificates.length}
          />
        </div>

        {/* Tab content */}
        <div
          style={{
            opacity: contentVisible ? 1 : 0,
            transition: "opacity 150ms ease",
          }}
        >
          {activeTab === "certificates" ? (
            <CertificatesPanel
              initialCertificates={certificates}
              features={features}
              profile={profile}
              onCertificatesChange={setCertificates}
              externalEdit={externalEdit}
              onExternalEditDone={() => setExternalEdit(null)}
            />
          ) : (
            <BadgesPanel
              initialBadges={badges}
              onBadgesChange={setBadges}
              initialSortStrategy={profile.badgeSortStrategy as "recent" | "oldest" | "alphabetical" | "organization" | "custom" | undefined}
            />
          )}
        </div>
      </div>

      {/* Right: activity panel — always visible */}
      <div className="w-full lg:flex-[0_0_22%] lg:min-w-0 lg:sticky lg:top-20 order-first lg:order-none">
        <ActivityPanel
          certificates={certificates}
          profileViews={profile.profileViews}
          slug={profile.slug}
          onEditCertificate={(cert) => setExternalEdit(cert)}
        />
      </div>
    </div>
  );
}
