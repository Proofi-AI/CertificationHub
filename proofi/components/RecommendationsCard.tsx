"use client";

import { useState, useMemo } from "react";
import type { Certificate } from "@prisma/client";
import { getRecommendations } from "@/lib/recommendationEngine";
import type { CertRecommendation } from "@/lib/recommendationsDb";

const LEVEL_COLORS: Record<CertRecommendation["level"], { bg: string; text: string; border: string }> = {
  beginner:     { bg: "rgba(16,185,129,0.09)",  text: "#10b981", border: "rgba(16,185,129,0.22)" },
  intermediate: { bg: "rgba(59,130,246,0.09)",  text: "#3b82f6", border: "rgba(59,130,246,0.22)" },
  advanced:     { bg: "rgba(124,58,237,0.09)",  text: "#8b5cf6", border: "rgba(124,58,237,0.22)" },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface Props {
  certificates: Certificate[];
}

export default function RecommendationsCard({ certificates }: Props) {
  const [open, setOpen] = useState(false);
  const [offset, setOffset] = useState(0);

  const recommendations = useMemo(
    () => getRecommendations(certificates, offset),
    [certificates, offset]
  );

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none", background: "var(--surface-alt)" }}
      >
        <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-white/50 flex-1">
          Recommended certifications
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-white/30 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Collapsible body */}
      {open && (
        <>
          {recommendations.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-slate-400 dark:text-white/40">
                Add more certificates to unlock personalized recommendations.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recommendations.map((rec, i) => {
                  const lvl = LEVEL_COLORS[rec.level];
                  return (
                    <div key={i} className="px-4 py-3 flex flex-col gap-1.5">
                      <div className="flex items-start gap-2.5">
                        {/* Rank */}
                        <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                          <span className="text-[9px] font-black text-slate-400 dark:text-white/35">{i + 1}</span>
                        </div>
                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{rec.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5 truncate">{rec.issuer}</p>
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-1 ml-6.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold
                          bg-slate-100 dark:bg-white/[0.07] text-slate-600 dark:text-white/55 border border-black/[0.06] dark:border-white/[0.1]">
                          {rec.domain}
                        </span>
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: lvl.bg, color: lvl.text, border: `1px solid ${lvl.border}` }}
                        >
                          {capitalize(rec.level)}
                        </span>
                        {rec.free && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                            bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Free
                          </span>
                        )}
                      </div>

                      {/* Reason */}
                      <p className="text-[11px] text-slate-500 dark:text-white/45 leading-relaxed ml-6.5">{rec.reason}</p>
                    </div>
                  );
                })}
              </div>

              {/* Refresh */}
              <div className="px-4 py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  onClick={() => setOffset((o) => o + 5)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200
                    text-slate-500 hover:text-slate-900 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.07] hover:border-black/[0.12]
                    dark:text-white/55 dark:hover:text-white dark:bg-white/[0.05] dark:hover:bg-white/[0.10] dark:border-white/[0.09] dark:hover:border-white/[0.18]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  Refresh suggestions
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
