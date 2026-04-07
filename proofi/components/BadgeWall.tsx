"use client";

import { useMemo, useState } from "react";
import type { Badge } from "@prisma/client";
import { buildOrgColorMap, type OrgColor } from "@/lib/orgColors";

interface Props {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
  maxVisible?: number;
  // Optional: pass a pre-built color map so badge borders match external pill colors exactly
  orgColorMap?: Map<string, OrgColor>;
}

const FALLBACK_COLOR: OrgColor = { border: "#7c3aed", pill: "rgba(124,58,237,0.12)", pillText: "#7c3aed", pillBorder: "rgba(124,58,237,0.40)" };

function BadgeTile({
  badge,
  index,
  color,
  onClick,
}: {
  badge: Badge;
  index: number;
  color: OrgColor;
  onClick: () => void;
}) {
  const orgInitials = (badge.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <div className="relative group" style={{ animationDelay: `${index * 30}ms` }}>
      <button
        type="button"
        onClick={onClick}
        className="w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          background: "var(--surface)",
          border: `1.5px solid ${color.border}55`,
          boxShadow: "var(--card-shadow)",
        }}
      >
        {badge.imageUrl && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={badge.imageUrl}
            alt={badge.title}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${color.border}, ${color.border}bb)` }}
          >
            {orgInitials}
          </div>
        )}

        {badge.credentialUrl && (
          <div
            className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#0d9488", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}
      </button>
    </div>
  );
}

// 2 rows × columns at each breakpoint: 5→10, 6→12, 7→14, 8→16
const TWO_ROW_LIMITS = { base: 10, sm: 12, md: 14, lg: 16 };

export default function BadgeWall({ badges, onBadgeClick, orgColorMap: externalColorMap }: Omit<Props, "maxVisible">) {
  const [showAll, setShowAll] = useState(false);
  const hasMore = badges.length > TWO_ROW_LIMITS.base;

  // Use the external map when provided (ensures pill colors match border colors).
  // Fall back to building from the badge list itself when used standalone.
  const internalColorMap = useMemo(() => {
    if (externalColorMap) return null;
    const orgs = Array.from(new Set(badges.map(b => b.issuingOrganization)));
    return buildOrgColorMap(orgs);
  }, [badges, externalColorMap]);

  const colorMap = externalColorMap ?? internalColorMap!;

  return (
    <div>
      <div
        className={
          "grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3" +
          (!showAll
            ? " [&>*:nth-child(n+11)]:hidden sm:[&>*:nth-child(n+11)]:block sm:[&>*:nth-child(n+13)]:hidden md:[&>*:nth-child(n+13)]:block md:[&>*:nth-child(n+15)]:hidden lg:[&>*:nth-child(n+15)]:block lg:[&>*:nth-child(n+17)]:hidden"
            : "")
        }
      >
        {badges.map((badge, i) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            index={i}
            color={colorMap.get(badge.issuingOrganization) ?? FALLBACK_COLOR}
            onClick={() => onBadgeClick(badge)}
          />
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-5 mx-auto flex items-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10"
        >
          View all {badges.length} badges
        </button>
      )}
      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-5 mx-auto flex items-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10"
        >
          View less
        </button>
      )}
    </div>
  );
}
