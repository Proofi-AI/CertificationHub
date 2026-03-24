"use client";

import { useState } from "react";
import type { Certificate } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_GRAD } from "@/lib/constants";
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
  const colors = DOMAIN_COLORS[certificate.domain] ?? DOMAIN_COLORS["Other"];
  const grad = DOMAIN_GRAD[certificate.domain] ?? DOMAIN_GRAD["Other"];
  const isPdf = certificate.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <>
    <div className={`relative rounded-2xl border border-white/8 bg-gradient-to-br ${grad} overflow-hidden group hover:border-white/15 transition-all`}>
      {/* Certificate image — clickable */}
      {certificate.imageUrl && (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="w-full block relative h-36 overflow-hidden border-b border-white/5 bg-black/20"
          title="Click to view full size"
        >
          {isPdf ? (
            <div className="h-full w-full relative overflow-hidden bg-white">
              <iframe
                src={`${certificate.imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full pointer-events-none"
                style={{ border: "none" }}
                title={certificate.name}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={certificate.imageUrl} alt={certificate.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
              </div>
            </>
          )}
        </button>
      )}

      <div className="p-4 space-y-3">
        {/* Domain badge + visibility toggle */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} font-medium truncate max-w-[60%]`}>
            {certificate.domain}
          </span>
          {/* Visibility toggle */}
          <button
            onClick={() => onVisibilityToggle(certificate.id, !certificate.isPublic)}
            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${certificate.isPublic ? "bg-emerald-500" : "bg-white/15"}`}
            title={certificate.isPublic ? "Public — click to hide" : "Hidden — click to make public"}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${certificate.isPublic ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Name & issuer */}
        <div>
          <p className="font-semibold text-sm leading-tight">{certificate.name}</p>
          <p className="text-white/50 text-xs mt-0.5">{certificate.issuer}</p>
        </div>

        {/* Dates */}
        <div className="flex items-center gap-3 text-xs text-white/35">
          <span>{formatDate(certificate.issuedAt)}</span>
          {certificate.expiresAt ? (
            <><span>·</span><span>Expires {formatDate(certificate.expiresAt)}</span></>
          ) : (
            <><span>·</span><span>No expiry</span></>
          )}
        </div>

        {/* Visibility label */}
        <p className="text-xs text-white/30">
          {certificate.isPublic ? "Visible on public profile" : "Hidden from public profile"}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onEdit(certificate)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg py-2 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit
          </button>

          {confirmDelete ? (
            <div className="flex-1 flex items-center gap-1">
              <button
                onClick={() => { onDelete(certificate.id); setConfirmDelete(false); }}
                className="flex-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2 hover:bg-red-500/20 transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg py-2 hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg py-2 px-3 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Lightbox */}
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
