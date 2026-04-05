"use client";

import type { Badge } from "@prisma/client";

interface Props {
  badges: Badge[];
  onBadgeClick: (badge: Badge) => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function BadgeTrophyShelf({ badges, onBadgeClick }: Props) {
  const featured = badges.filter((b) => b.isFeatured).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Compact "Pinned" label */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">Pinned</span>
      </div>

      {/* Pinned badge cards with visible preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {featured.map((badge) => {
          const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
          const orgInitials = (badge.issuingOrganization || "?")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={badge.id}
              type="button"
              onClick={() => onBadgeClick(badge)}
              className="rounded-xl overflow-hidden text-left cursor-pointer flex flex-col"
              style={{
                background: "var(--surface)",
                border: "1px solid rgba(245,158,11,0.4)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              {/* Amber accent bar */}
              <div className="h-[3px] w-full shrink-0" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }} />

              {/* Badge image preview */}
              <div
                className="w-full h-20 relative overflow-hidden shrink-0"
                style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
              >
                {badge.imageUrl && !isPdf ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={badge.imageUrl} alt={badge.title} className="absolute inset-0 w-full h-full object-contain p-2" />
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center text-lg font-black text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    {orgInitials}
                  </div>
                )}
              </div>

              {/* Text info */}
              <div className="px-3 py-2.5 flex-1 flex flex-col gap-0.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">
                  {badge.title}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">
                  {badge.issuingOrganization}
                  {badge.issuedAt ? <span className="text-slate-300 dark:text-white/20"> · {formatDate(badge.issuedAt)}</span> : null}
                </p>
                {badge.credentialUrl && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
