"use client";

import { useState } from "react";
import type { Badge } from "@prisma/client";

interface Props {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function BadgeTrophyShelf({ badges, onBadgeClick }: Props) {
  const featured = badges.filter((b) => b.isFeatured).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-start">
        {featured.map((badge, i) => (
          <TrophyCard
            key={badge.id}
            badge={badge}
            onClick={() => onBadgeClick(badge)}
            delay={200 + i * 100}
          />
        ))}
      </div>
    </div>
  );
}

function TrophyCard({ badge, onClick, delay }: { badge: Badge; onClick: () => void; delay: number }) {
  const [hovered, setHovered] = useState(false);

  const orgInitials = (badge.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex-1 max-w-[220px] mx-auto sm:mx-0 relative flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 text-left"
      style={{
        background: "var(--surface)",
        border: hovered ? "1px solid rgba(124,58,237,0.35)" : "1px solid var(--border)",
        boxShadow: hovered ? "0 12px 40px rgba(124,58,237,0.25)" : "var(--card-shadow)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      {/* Featured badge label */}
      <span
        className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)" }}
      >
        Featured
      </span>

      {/* Badge image — circular frame with amber ring */}
      <div
        className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center mt-3"
        style={{ boxShadow: hovered
          ? "0 0 0 3px #f59e0b, 0 0 0 6px rgba(245,158,11,0.15), 0 8px 24px rgba(245,158,11,0.2)"
          : "0 0 0 2px rgba(245,158,11,0.6), 0 0 0 5px rgba(245,158,11,0.1)"
        }}
      >
        {badge.imageUrl && !isPdf ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-lg font-black text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {orgInitials}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-[11px] text-slate-400 dark:text-white/40 mb-1 truncate max-w-[160px]">
          {badge.issuingOrganization}
        </p>
        <h3 className="font-bold text-sm leading-tight line-clamp-2 text-slate-900 dark:text-white text-center">
          {badge.title}
        </h3>
        <p className="text-[11px] mt-1 text-slate-400 dark:text-white/35">
          {formatDate(badge.issuedAt)}
        </p>
      </div>

      {/* Verified indicator */}
      {badge.credentialUrl && (
        <div
          className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full"
          style={{ background: "rgba(13,148,136,0.1)", color: "#0d9488", border: "1px solid rgba(13,148,136,0.2)" }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Verified
        </div>
      )}
    </button>
  );
}
