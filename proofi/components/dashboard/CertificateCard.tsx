"use client";

import { useEffect, useRef, useState } from "react";
import type { Certificate } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_ACCENT } from "@/lib/constants";
import CertificateLightbox from "@/components/CertificateLightbox";
import CertificateStrengthBar from "@/components/CertificateStrengthBar";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import InfoModal from "@/components/InfoModal";

interface Props {
  certificate: Certificate;
  onEdit: (cert: Certificate) => void;
  onDelete: (id: string) => void;
  onVisibilityToggle: (id: string, isPublic: boolean) => void;
  onFeatureToggle: (id: string, isFeatured: boolean) => void;
  featuredCount: number;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent, id: string) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  dragOverId?: string | null;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CertificateCard({
  certificate, onEdit, onDelete, onVisibilityToggle, onFeatureToggle, featuredCount,
  isDraggable = false,
  onDragStart, onDragOver, onDrop,
  dragOverId,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pinLimitOpen, setPinLimitOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
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
  const isDragOver = dragOverId === certificate.id;

  const colors = DOMAIN_COLORS[certificate.domain] ?? DOMAIN_COLORS["Other"];
  const accent = DOMAIN_ACCENT[certificate.domain] ?? DOMAIN_ACCENT["Other"];
  const isPdf = certificate.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <>
      <div
        className="group relative rounded-2xl overflow-hidden flex flex-col transition-all duration-300"
        draggable={isDraggable}
        onDragStart={isDraggable && onDragStart ? (e) => onDragStart(e, certificate.id) : undefined}
        onDragOver={isDraggable && onDragOver ? (e) => onDragOver(e, certificate.id) : undefined}
        onDrop={isDraggable && onDrop ? (e) => onDrop(e, certificate.id) : undefined}
        style={{
          background: "var(--surface)",
          border: isDragOver ? "2px dashed #7c3aed" : "1px solid var(--border)",
          boxShadow: isDragOver ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
          cursor: isDraggable ? "grab" : undefined,
          opacity: isDragOver ? 0.85 : 1,
        }}
      >
        {/* Drag handle — only in custom sort mode */}
        {isDraggable && (
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg"
            style={{ background: "rgba(0,0,0,0.4)", cursor: "grab" }}
            title="Drag to reorder"
          >
            <svg className="w-3 h-3 text-white/80" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.2"/><circle cx="11" cy="3" r="1.2"/>
              <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
              <circle cx="5" cy="13" r="1.2"/><circle cx="11" cy="13" r="1.2"/>
            </svg>
          </div>
        )}
        {/* Domain accent bar */}
        <div className="h-[3px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

        {/* Preview */}
        {certificate.imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full relative overflow-hidden block"
            style={{ aspectRatio: "3/2", background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
            title="View full size"
          >
            {isPdf ? (
              <div className="absolute inset-0 overflow-hidden bg-[#f8f8fa]">
                {/* Desktop: render PDF inline */}
                <iframe
                  src={`${certificate.imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="hidden sm:block w-full h-full pointer-events-none"
                  style={{ border: "none" }}
                  title={certificate.name}
                />
                {/* Mobile: PDF iframes render at native zoom and look broken — show placeholder instead */}
                <div className="flex sm:hidden flex-col items-center justify-center h-full gap-2 text-slate-400 dark:text-white/30">
                  <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-[11px] font-medium">PDF Certificate</span>
                </div>
              </div>
            ) : (
              <>
                {/* Blurred image fills the letterbox areas with the certificate's own colours */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificate.imageUrl}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 pointer-events-none"
                />
                {/* Frosted glass overlay so the blur doesn't look too vivid */}
                <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-none pointer-events-none" />
                {/* Main certificate image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificate.imageUrl}
                  alt={certificate.name}
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </>
            )}
          </button>
        ) : (
          <div className="h-24 flex items-center justify-center" style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
            <svg className="w-8 h-8 text-slate-300 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col gap-4">

          {/* Domain badge + visibility toggle */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} tracking-wide min-w-0 max-w-full`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent.from }} />
                <span className="truncate">{certificate.domain}</span>
              </span>
              {certificate.verifyStatus === "ai_verified" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.25)",
                  }}
                  title="This certificate was analyzed and looks authentic"
                >
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  AI Verified
                </span>
              )}
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => onVisibilityToggle(certificate.id, !certificate.isPublic)}
              title={certificate.isPublic ? "Public — click to hide" : "Hidden — click to make public"}
              className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 self-start mt-0.5 ${
                certificate.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"
              }`}
            >
              <span
                className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  certificate.isPublic ? "translate-x-[18px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Name & issuer */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] leading-snug line-clamp-2 text-slate-900 dark:text-white">{certificate.name}</h3>
            <p className="text-[13px] mt-1 truncate text-slate-500 dark:text-white/60">{certificate.issuer}</p>
          </div>

          {/* Description — collapsed one-liner, expands as floating overlay */}
          {certificate.description && (
            <div className="relative" ref={descRef}>
              <button
                type="button"
                onClick={() => setDescExpanded((v) => !v)}
                className="flex items-center gap-1.5 w-full text-left"
              >
                <span className="text-[12px] text-slate-400 dark:text-white/35 truncate flex-1">
                  {certificate.description}
                </span>
                <svg
                  className={`w-3 h-3 shrink-0 text-slate-300 dark:text-white/25 transition-transform duration-200 ${descExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {descExpanded && (
                <div
                  className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl p-3"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border-hover)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  }}
                >
                  <p className="text-[12px] leading-relaxed text-slate-500 dark:text-white/50 whitespace-pre-wrap break-words">
                    {certificate.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-white/40">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <span>{formatDate(certificate.issuedAt)}</span>
            <span className="text-slate-200 dark:text-white/20">·</span>
            <span>{certificate.expiresAt ? `Exp. ${formatDate(certificate.expiresAt)}` : "No expiry"}</span>
          </div>

          {/* Strength bar — sits above actions */}
          <CertificateStrengthBar certificate={certificate} />

          {/* Actions */}
          <div className="pt-2 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => {
                if (!certificate.isFeatured && featuredCount >= 3) {
                  setPinLimitOpen(true);
                  return;
                }
                onFeatureToggle(certificate.id, !certificate.isFeatured);
              }}
              title={certificate.isFeatured ? "Unpin from profile" : "Pin to profile"}
              className={`w-7 h-[28px] flex items-center justify-center rounded-lg transition-all duration-200 ${
                certificate.isFeatured
                  ? "text-amber-500 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/15"
                  : "text-slate-400 hover:text-amber-500 bg-black/[0.04] hover:bg-amber-500/10 border border-black/[0.06] hover:border-amber-500/20 dark:text-white/40 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-amber-500/10 dark:hover:border-amber-500/20"
              }`}
            >
              <svg className="w-2.5 h-2.5" fill={certificate.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>

            <button
              onClick={() => onEdit(certificate)}
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
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {lightboxOpen && certificate.imageUrl && (
        <CertificateLightbox
          src={certificate.imageUrl}
          alt={`${certificate.name} — ${certificate.issuer}`}
          isPdf={isPdf}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {confirmDelete && (
        <DeleteConfirmModal
          title="Delete this certificate?"
          message="This will permanently remove the certificate and its image. This cannot be undone."
          onConfirm={() => { onDelete(certificate.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {pinLimitOpen && (
        <InfoModal
          title="Pin limit reached"
          message="You can only pin up to 3 certificates. Unpin one first to pin another."
          onClose={() => setPinLimitOpen(false)}
        />
      )}
    </>
  );
}
