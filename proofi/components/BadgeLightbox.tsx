"use client";

import { useEffect, useState } from "react";
import type { Badge } from "@prisma/client";

interface Props {
  badge: Badge;
  onClose: () => void;
  isMobile?: boolean;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BadgeLightbox({ badge, onClose, isMobile = false }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleShare = async () => {
    const url = window.location.href.split("?")[0] + `?badge=${badge.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  const orgInitials = (badge.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full ${isMobile ? "rounded-t-3xl max-h-[92vh]" : "sm:max-w-md rounded-2xl"} overflow-y-auto`}
        style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all bg-black/30 text-white hover:bg-black/50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Badge image */}
        <div className="flex items-center justify-center p-8 pb-4" style={{ background: "var(--surface-alt)" }}>
          {badge.imageUrl && !isPdf ? (
            <div className="relative w-36 h-36 rounded-full overflow-hidden"
              style={{ boxShadow: "0 0 0 3px rgba(124,58,237,0.4), 0 12px 40px rgba(124,58,237,0.3)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center text-4xl font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 0 3px rgba(124,58,237,0.4), 0 12px 40px rgba(124,58,237,0.3)" }}
            >
              {orgInitials}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{badge.title}</h2>
            <p className="text-sm mt-1 text-slate-500 dark:text-white/55">{badge.issuingOrganization}</p>
          </div>

          <div className="flex justify-center gap-4 text-sm text-slate-500 dark:text-white/50">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400 dark:text-white/35">Issued</p>
              <p>{formatDate(badge.issuedAt)}</p>
            </div>
            <div className="w-px" style={{ background: "var(--border)" }} />
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5 text-slate-400 dark:text-white/35">Expires</p>
              <p>{badge.expiresAt ? formatDate(badge.expiresAt) : "No expiry"}</p>
            </div>
          </div>

          {badge.description && (
            <p className="text-sm text-slate-500 dark:text-white/55 leading-relaxed text-center">{badge.description}</p>
          )}

          {badge.credentialId && (
            <p className="text-xs font-mono text-center text-slate-400 dark:text-white/30">
              ID: {badge.credentialId}
            </p>
          )}

          <div className="space-y-2 pt-2">
            {badge.credentialUrl && (
              <a
                href={badge.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #0d9488, #0891b2)", boxShadow: "0 4px 16px rgba(13,148,136,0.35)" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verify credential
              </a>
            )}
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all
                text-slate-600 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.07] dark:hover:bg-white/[0.09]"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Link copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Share this badge
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
