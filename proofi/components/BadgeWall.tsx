"use client";

import { useState } from "react";
import type { Badge } from "@prisma/client";

interface Props {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
  maxVisible?: number;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function BadgeTile({
  badge,
  index,
  onClick,
}: {
  badge: Badge;
  index: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300"
        style={{
          background: "var(--surface)",
          border: hovered ? "1px solid rgba(124,58,237,0.35)" : "1px solid var(--border)",
          boxShadow: hovered ? "0 8px 28px rgba(124,58,237,0.2)" : "var(--card-shadow)",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
        }}
      >
        {badge.imageUrl && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain p-2" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {orgInitials}
          </div>
        )}

        {/* Verified indicator */}
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

      {/* Tooltip on hover */}
      {hovered && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none whitespace-nowrap"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-hover)",
            borderRadius: 10,
            padding: "6px 10px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            minWidth: 140,
          }}
        >
          <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{badge.title}</p>
          <p className="text-[10px] text-slate-500 dark:text-white/45 truncate">{badge.issuingOrganization}</p>
          <p className="text-[10px] text-slate-400 dark:text-white/30">{formatDate(badge.issuedAt)}</p>
          {badge.credentialUrl && (
            <p className="text-[10px] text-teal-600 dark:text-teal-400 flex items-center gap-1 mt-0.5">
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Verified
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BadgeWall({ badges, onBadgeClick, maxVisible = 24 }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? badges : badges.slice(0, maxVisible);
  const hasMore = badges.length > maxVisible;

  return (
    <div>
      {/* Responsive square grid — matches certificate grid style */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3">
        {visible.map((badge, i) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            index={i}
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
    </div>
  );
}
