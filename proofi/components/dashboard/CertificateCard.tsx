"use client";

import { useState } from "react";
import type { Certificate } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_ACCENT } from "@/lib/constants";
import CertificateLightbox from "@/components/CertificateLightbox";

interface Props {
  certificate: Certificate;
  onEdit: (cert: Certificate) => void;
  onDelete: (id: string) => void;
  onVisibilityToggle: (id: string, isPublic: boolean) => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CertificateCard({ certificate, onEdit, onDelete, onVisibilityToggle }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const colors = DOMAIN_COLORS[certificate.domain] ?? DOMAIN_COLORS["Other"];
  const accent = DOMAIN_ACCENT[certificate.domain] ?? DOMAIN_ACCENT["Other"];
  const isPdf = certificate.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <>
      <div
        className="group relative rounded-2xl bg-[#0d0d18] overflow-hidden flex flex-col transition-all duration-300"
        style={{
          border: hovered ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.055)",
          boxShadow: hovered
            ? `0 12px 48px ${accent.glow}, 0 4px 16px rgba(0,0,0,0.5)`
            : "0 2px 16px rgba(0,0,0,0.35)",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Domain accent bar */}
        <div
          className="h-[3px] w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
        />

        {/* Preview */}
        {certificate.imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="w-full relative h-44 overflow-hidden bg-[#080810] border-b border-white/[0.04] block"
            title="View full size"
          >
            {isPdf ? (
              <div className="h-full w-full overflow-hidden bg-[#f8f8fa]">
                <iframe
                  src={`${certificate.imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                  className="w-full h-full pointer-events-none"
                  style={{ border: "none" }}
                  title={certificate.name}
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={certificate.imageUrl}
                alt={certificate.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
              />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div
                className="w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"
                style={{ background: "rgba(0,0,0,0.7)" }}
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </div>
            </div>
          </button>
        ) : (
          <div className="h-24 bg-[#080810] border-b border-white/[0.04] flex items-center justify-center">
            <svg className="w-8 h-8 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
            </svg>
          </div>
        )}

        {/* Body */}
        <div className="p-5 flex-1 flex flex-col gap-4">
          {/* Domain badge + visibility */}
          <div className="flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} tracking-wide`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent.from }} />
              {certificate.domain}
            </span>

            <button
              onClick={() => onVisibilityToggle(certificate.id, !certificate.isPublic)}
              title={certificate.isPublic ? "Public — click to hide" : "Hidden — click to make public"}
              className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0 ${
                certificate.isPublic ? "bg-emerald-500" : "bg-white/15"
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
            <h3 className="font-bold text-[15px] text-white/90 leading-snug line-clamp-2">{certificate.name}</h3>
            <p className="text-[13px] text-white/40 mt-1 truncate">{certificate.issuer}</p>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-[12px] text-white/25">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
            </svg>
            <span>{formatDate(certificate.issuedAt)}</span>
            <span className="text-white/10">·</span>
            <span>{certificate.expiresAt ? `Exp. ${formatDate(certificate.expiresAt)}` : "No expiry"}</span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-white/[0.05] flex items-center gap-2">
            <button
              onClick={() => onEdit(certificate)}
              className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-white/40 hover:text-white/90 py-2.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.14] transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
              Edit
            </button>

            {confirmDelete ? (
              <div className="flex-1 flex items-center gap-1.5">
                <button
                  onClick={() => { onDelete(certificate.id); setConfirmDelete(false); }}
                  className="flex-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl py-2.5 hover:bg-red-500/20 transition-all"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 text-xs font-semibold text-white/35 bg-white/[0.03] border border-white/[0.06] rounded-xl py-2.5 hover:bg-white/[0.07] transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                title="Delete"
                className="flex items-center justify-center w-10 h-[38px] rounded-xl text-white/20 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.06] hover:border-red-500/20 transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
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
    </>
  );
}
