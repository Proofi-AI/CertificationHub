"use client";

import { useState, useMemo } from "react";
import type { Certificate } from "@prisma/client";
import { generateInsights, type Insight } from "@/lib/insightEngine";
import { detectGaps, type Gap } from "@/lib/gapDetector";

/* ── Icons ─────────────────────────────────────────────────────────────── */

function InsightIcon({ type }: { type: Insight["type"] }) {
  const color =
    type === "strength" ? "#10b981"
    : type === "suggestion" ? "#3b82f6"
    : type === "warning" ? "#f59e0b"
    : "#8b5cf6";

  const paths: Record<Insight["type"], string> = {
    strength: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    suggestion: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
    warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    milestone: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0",
  };

  return (
    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}28` }}>
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color }}>
        <path strokeLinecap="round" strokeLinejoin="round" d={paths[type]} />
      </svg>
    </div>
  );
}

/* ── Domain Gaps Section ─────────────────────────────────────────────────── */

function DomainGapsSection({ gaps }: { gaps: Gap[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {/* Toggle row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-left transition-all
          hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-slate-400 dark:text-white/40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
          </svg>
          <span className="text-xs font-bold text-slate-700 dark:text-white/70">Domain gaps</span>
          {gaps.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {gaps.length}
            </span>
          )}
        </div>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 dark:text-white/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {gaps.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-white/50 py-2">
              Your portfolio covers a great range of domains — no obvious gaps detected.
            </p>
          ) : (
            gaps.map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: gap.strength === "strong" ? "rgba(245,158,11,0.06)" : "var(--surface-alt)",
                  border: `1px solid ${gap.strength === "strong" ? "rgba(245,158,11,0.18)" : "var(--border)"}`,
                }}
              >
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 mt-0.5"
                  style={{
                    background: gap.strength === "strong" ? "rgba(245,158,11,0.14)" : "rgba(100,116,139,0.12)",
                    color: gap.strength === "strong" ? "#d97706" : "#64748b",
                    border: `1px solid ${gap.strength === "strong" ? "rgba(245,158,11,0.22)" : "rgba(100,116,139,0.18)"}`,
                  }}
                >
                  {gap.missingDomain}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-white/50 leading-relaxed">{gap.reason}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

interface Props {
  certificates: Certificate[];
}

export default function InsightsCard({ certificates }: Props) {
  const insights = useMemo(() => generateInsights(certificates), [certificates]);
  const gaps = useMemo(() => detectGaps(certificates), [certificates]);

  const accentColor: Record<Insight["type"], string> = {
    strength: "#10b981",
    suggestion: "#3b82f6",
    warning: "#f59e0b",
    milestone: "#8b5cf6",
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-alt)" }}
      >
        <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
        <h2 className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-white/50">Portfolio insights</h2>
      </div>

      {/* Empty state */}
      {certificates.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-slate-400 dark:text-white/40">
            Add your first certificate to unlock portfolio insights.
          </p>
        </div>
      ) : (
        <>
          {/* Insights list */}
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 px-5 py-3.5 transition-opacity"
                style={{
                  animationDelay: `${i * 50}ms`,
                  animation: "fadeSlideIn 0.3s ease both",
                }}
              >
                {/* Colored left accent bar */}
                <div
                  className="w-[3px] self-stretch rounded-full shrink-0 mt-0.5"
                  style={{ background: accentColor[insight.type], minHeight: 20 }}
                />
                <InsightIcon type={insight.type} />
                <p className="text-xs text-slate-700 dark:text-white/70 leading-relaxed pt-1 flex-1">
                  {insight.message}
                </p>
              </div>
            ))}
          </div>

          {/* Domain gaps section */}
          <DomainGapsSection gaps={gaps} />
        </>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
