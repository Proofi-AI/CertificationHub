"use client";

import { useEffect, useRef, useState } from "react";
import type { Badge } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_ACCENT } from "@/lib/constants";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Props {
  badge: Badge;
  onEdit: (badge: Badge) => void;
  onDelete: (id: string) => void;
  onVisibilityToggle: (id: string, isPublic: boolean) => void;
  onFeatureToggle: (id: string, isFeatured: boolean) => void;
  featuredCount: number;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: () => void;
  dragOverId?: string | null;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function BadgeStrengthBar({ badge }: { badge: Badge }) {
  const [show, setShow] = useState(false);

  let score = 0;
  if (badge.imageUrl) score += 2;
  if (badge.credentialId) score += 1;
  if (badge.credentialUrl) score += 1;
  if (badge.description) score += 1;

  const max = 5;
  const pct = Math.round((score / max) * 100);
  const color = score >= 5 ? "#10b981" : score >= 3 ? "#3b82f6" : score >= 1 ? "#f59e0b" : "#ef4444";
  const label = score >= 5 ? "Complete" : score >= 3 ? "Good" : score >= 1 ? "Basic" : "Incomplete";

  const missing: string[] = [];
  if (!badge.imageUrl) missing.push("Add badge image (+2)");
  if (!badge.credentialId) missing.push("Add credential ID (+1)");
  if (!badge.credentialUrl) missing.push("Add credential URL (+1)");
  if (!badge.description) missing.push("Add description (+1)");

  return (
    <div className="relative">
      <div
        className="relative w-full h-[4px] cursor-help"
        style={{ background: "var(--border)" }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>

      {show && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 z-30 px-3 py-2 rounded-xl text-xs shadow-xl pointer-events-none"
          style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 8px 24px rgba(0,0,0,0.18)", color: "var(--foreground)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
            <span className="font-bold text-[11px]" style={{ color }}>{label}</span>
            <span className="text-[10px] text-slate-400 dark:text-white/40 ml-auto">{score}/{max}</span>
          </div>
          {missing.length > 0 && (
            <p className="text-slate-600 dark:text-white/60">{missing.slice(0, 2).join(" · ")}</p>
          )}
          <div className="absolute -bottom-[5px] left-4 w-2.5 h-2.5 rotate-45" style={{ background: "var(--surface)", borderRight: "1px solid var(--border-hover)", borderBottom: "1px solid var(--border-hover)" }} />
        </div>
      )}
    </div>
  );
}

export default function BadgeCard({ badge, onEdit, onDelete, onVisibilityToggle, onFeatureToggle, featuredCount, isDraggable = false, onDragStart, onDragOver, onDrop, onDragEnd, dragOverId }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!descExpanded) return;
    const handler = (e: MouseEvent) => {
      if (descRef.current && !descRef.current.contains(e.target as Node)) {
        setDescExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [descExpanded]);

  const isDragOver = dragOverId === badge.id;
  const domain = badge.domain || "Other";
  const colors = DOMAIN_COLORS[domain] ?? DOMAIN_COLORS["Other"];
  const accent = DOMAIN_ACCENT[domain] ?? DOMAIN_ACCENT["Other"];
  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  const orgInitials = (badge.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFeatureClick = () => {
    if (!badge.isFeatured && featuredCount >= 3) {
      alert("You can only feature up to 3 badges. Unpin one first.");
      return;
    }
    onFeatureToggle(badge.id, !badge.isFeatured);
  };

  return (
    <>
    <div
      className="group relative rounded-2xl flex flex-col transition-all duration-300"
      draggable={isDraggable}
      onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, badge.id) : undefined}
      onDragOver={isDraggable && onDragOver ? (e) => onDragOver(e, badge.id) : undefined}
      onDrop={isDraggable && onDrop ? (e) => onDrop(e, badge.id) : undefined}
      onDragEnd={isDraggable && onDragEnd ? onDragEnd : undefined}
      style={{
        background: "var(--surface)",
        border: isDragOver ? "2px dashed #7c3aed" : "1px solid var(--border)",
        boxShadow: isDragOver ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
        cursor: isDraggable ? "grab" : undefined,
        opacity: isDragOver ? 0.85 : 1,
      }}
    >
      {isDraggable && (
        <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg"
          style={{ background: "rgba(0,0,0,0.4)", cursor: "grab" }} title="Drag to reorder">
          <svg className="w-3 h-3 text-white/80" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.2"/><circle cx="11" cy="3" r="1.2"/>
            <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
            <circle cx="5" cy="13" r="1.2"/><circle cx="11" cy="13" r="1.2"/>
          </svg>
        </div>
      )}
      {/* Credential URL link — top right */}
      {badge.credentialUrl && (
        <a
          href={badge.credentialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          title="View credential"
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}

      {/* Image section — clipped to round the top corners */}
      <div className="overflow-hidden rounded-t-2xl shrink-0">
        {/* Domain accent bar */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

        {/* Badge image area — square */}
        <div
          className="w-full flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: "1/1", background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
        >
          {badge.imageUrl && !isPdf ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badge.imageUrl}
              alt={badge.title}
              className="w-full h-full object-contain"
            />
          ) : badge.imageUrl && isPdf ? (
            <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-white/30">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-[11px]">PDF</span>
            </div>
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white"
              style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
            >
              {orgInitials}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col gap-2">

        {/* Org name + visibility */}
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[11px] text-slate-500 dark:text-white/50 truncate flex-1 min-w-0">
            {badge.issuingOrganization}
          </p>
          <button
            onClick={() => onVisibilityToggle(badge.id, !badge.isPublic)}
            title={badge.isPublic ? "Public — click to hide" : "Hidden — click to make public"}
            className={`relative w-7 h-[15px] rounded-full transition-colors duration-200 shrink-0 mt-0.5 ${
              badge.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"
            }`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[11px] h-[11px] bg-white rounded-full shadow-sm transition-transform duration-200 ${
                badge.isPublic ? "translate-x-[12px]" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[12px] leading-snug line-clamp-2 text-slate-900 dark:text-white">
          {badge.title}
        </h3>

        {/* Description */}
        {badge.description && (
          <div className="relative" ref={descRef}>
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="flex items-center gap-1 w-full text-left"
            >
              <span className="text-[11px] text-slate-400 dark:text-white/35 truncate flex-1">
                {badge.description}
              </span>
              <svg
                className={`w-2.5 h-2.5 shrink-0 text-slate-300 dark:text-white/20 transition-transform duration-200 ${descExpanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {descExpanded && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl p-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
              >
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-white/50 whitespace-pre-wrap break-words">
                  {badge.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-white/40">
          <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
          </svg>
          <span>{formatDate(badge.issuedAt)}</span>
        </div>

        {/* Domain pill */}
        {badge.domain && (
          <span className={`inline-flex items-center gap-1 self-start text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border} tracking-wide`}>
            <span className="w-1 h-1 rounded-full" style={{ background: accent.from }} />
            {badge.domain}
          </span>
        )}

        {/* Strength bar */}
        <BadgeStrengthBar badge={badge} />

        {/* Actions */}
        <div className="pt-2 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
          {/* Pin to profile */}
          <button
            onClick={handleFeatureClick}
            title={badge.isFeatured ? "Unpin from profile" : "Pin to profile"}
            className={`w-7 h-[28px] flex items-center justify-center rounded-lg transition-all duration-200
              ${badge.isFeatured
                ? "text-amber-500 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15"
                : "text-slate-400 hover:text-amber-500 bg-black/[0.04] hover:bg-amber-500/10 border border-black/[0.06] hover:border-amber-500/20 dark:text-white/40 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-amber-500/10 dark:hover:border-amber-500/20"
              }`}
          >
            <svg className="w-3 h-3" fill={badge.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </button>

          <button
            onClick={() => onEdit(badge)}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 px-1.5 rounded-lg transition-all duration-200
              text-slate-500 hover:text-slate-900 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] hover:border-black/[0.12]
              dark:text-white/55 dark:hover:text-white dark:bg-white/[0.05] dark:hover:bg-white/[0.10] dark:border-white/[0.09] dark:hover:border-white/[0.18]"
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </button>

          <button
            onClick={() => setConfirmDelete(true)}
            title="Delete"
            className="w-7 h-[28px] flex items-center justify-center rounded-lg transition-all duration-200
              text-slate-400 hover:text-red-600 bg-black/[0.04] hover:bg-red-500/10 border border-black/[0.06] hover:border-red-500/20
              dark:text-white/40 dark:hover:text-red-400 dark:bg-white/[0.05] dark:hover:bg-red-500/10 dark:border-white/[0.09] dark:hover:border-red-500/20"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    {confirmDelete && (
      <DeleteConfirmModal
        title="Delete this badge?"
        message="This will permanently remove the badge and its image. This cannot be undone."
        onConfirm={() => { onDelete(badge.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    )}
    </>
  );
}
