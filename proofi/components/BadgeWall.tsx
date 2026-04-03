"use client";

import { useEffect, useState } from "react";
import type { Badge } from "@prisma/client";

interface Props {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
  maxVisible?: number;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function HexBadge({
  badge,
  index,
  onClick,
  isMobile,
}: {
  badge: Badge;
  index: number;
  onClick: () => void;
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const orgInitials = (badge.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  // Mobile: circle layout; Desktop: hexagonal layout
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={() => { setShowTooltip(false); onClick(); }}
        onTouchStart={() => setShowTooltip((v) => !v)}
        className="relative flex items-center justify-center transition-all duration-300"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          overflow: "hidden",
          boxShadow: showTooltip ? "0 0 0 3px rgba(124,58,237,0.6)" : "0 2px 8px rgba(0,0,0,0.15)",
          transform: showTooltip ? "scale(1.1)" : "scale(1)",
          animationDelay: `${index * 30}ms`,
        }}
      >
        {badge.imageUrl && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            {orgInitials}
          </div>
        )}

        {/* Verified indicator */}
        {badge.credentialUrl && (
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "#0d9488" }}>
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        )}
      </button>
    );
  }

  // Desktop: hexagonal
  return (
    <div
      className="relative"
      style={{
        width: 90,
        height: 90,
        animationDelay: `${index * 30}ms`,
      }}
    >
      <button
        type="button"
        onClick={() => { setShowTooltip(false); onClick(); }}
        onMouseEnter={() => { setHovered(true); setShowTooltip(true); }}
        onMouseLeave={() => { setHovered(false); setShowTooltip(false); }}
        className="w-full h-full flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          boxShadow: hovered ? "0 0 20px rgba(124,58,237,0.5)" : undefined,
          filter: hovered ? "drop-shadow(0 0 12px rgba(124,58,237,0.5))" : undefined,
        }}
      >
        {badge.imageUrl && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            {orgInitials}
          </div>
        )}
      </button>

      {/* Verified indicator on hex corner */}
      {badge.credentialUrl && (
        <div
          className="absolute bottom-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "#0d9488", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
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
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on client
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const visible = showAll ? badges : badges.slice(0, maxVisible);
  const hasMore = badges.length > maxVisible;

  if (isMobile) {
    // Circle grid on mobile — 3 per row
    return (
      <div>
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {visible.map((badge, i) => (
            <HexBadge
              key={badge.id}
              badge={badge}
              index={i}
              onClick={() => onBadgeClick(badge)}
              isMobile={true}
            />
          ))}
        </div>
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-4 w-full text-sm font-semibold py-2.5 rounded-xl transition-all text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10"
          >
            View all {badges.length} badges
          </button>
        )}
      </div>
    );
  }

  // Desktop hexagonal grid with offset rows
  const HEX_SIZE = 90;
  const HEX_GAP = 6;
  const rowWidth = HEX_SIZE + HEX_GAP;
  const rowHeight = HEX_SIZE * 0.866 + HEX_GAP; // hex height factor

  // Group badges into rows of ~5
  const ROW_SIZE = 5;
  const rows: Badge[][] = [];
  for (let i = 0; i < visible.length; i += ROW_SIZE) {
    rows.push(visible.slice(i, i + ROW_SIZE));
  }

  return (
    <div>
      <div className="flex flex-col gap-1 items-center">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-1.5"
            style={{
              marginLeft: rowIdx % 2 === 1 ? HEX_SIZE / 2 + HEX_GAP / 2 : 0,
              marginTop: rowIdx > 0 ? -rowHeight * 0.28 : 0,
            }}
          >
            {row.map((badge, colIdx) => (
              <HexBadge
                key={badge.id}
                badge={badge}
                index={rowIdx * ROW_SIZE + colIdx}
                onClick={() => onBadgeClick(badge)}
                isMobile={false}
              />
            ))}
          </div>
        ))}
      </div>

      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 mx-auto flex items-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-xl transition-all text-violet-600 dark:text-violet-400 bg-violet-500/5 border border-violet-500/15 hover:bg-violet-500/10"
        >
          View all {badges.length} badges
        </button>
      )}
    </div>
  );
}
