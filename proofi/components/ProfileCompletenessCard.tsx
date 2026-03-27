"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Certificate } from "@prisma/client";

interface Props {
  certificates: Certificate[];
  avatarUrl: string | null;
  bio: string | null;
  slug: string;
}

interface Criterion {
  label: string;
  description: string;
  points: number;
  met: boolean;
  actionPath?: "settings" | "add-cert" | "certificates";
}

function CircleProgress({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setTimeout(() => setAnimated(score), 80);
    });
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const dash = circ * (animated / 100);
  const tierColor =
    score >= 85 ? "#10b981"
    : score >= 60 ? "#8b5cf6"
    : score >= 30 ? "#3b82f6"
    : "#f59e0b";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7"
          className="stroke-black/[0.07] dark:stroke-white/[0.08]" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="7"
          stroke={tierColor}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.2,0.64,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black leading-none text-slate-900 dark:text-white" style={{ fontSize: size * 0.24 }}>
          {score}
        </span>
        <span className="font-semibold text-slate-400 dark:text-white/40" style={{ fontSize: size * 0.11 }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function getTierInfo(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 85) return { label: "Profile pro", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" };
  if (score >= 60) return { label: "Looking strong", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)" };
  if (score >= 30) return { label: "Building up", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" };
  return { label: "Just getting started", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
}

export default function ProfileCompletenessCard({ certificates, avatarUrl, bio, slug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hasGoal, setHasGoal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("proofi_annual_goal");
    setHasGoal(!!stored && parseInt(stored, 10) > 0);
  }, []);

  const criteria = useMemo<Criterion[]>(() => {
    const totalCerts = certificates.length;
    const publicCerts = certificates.filter((c) => c.isPublic);
    const certsWithImage = certificates.filter((c) => c.imageUrl);
    const certsWithCredId = certificates.filter((c) => c.credentialId);
    const uniqueDomains = new Set(certificates.map((c) => c.domain.toLowerCase())).size;
    const isDefaultSlug = /\d$/.test(slug);

    return [
      { label: "Profile photo",        description: "Add a profile photo",                      points: 15, met: !!(avatarUrl),              actionPath: "settings" },
      { label: "Bio written",           description: "Write a bio (10+ characters)",              points: 10, met: !!(bio && bio.length >= 10), actionPath: "settings" },
      { label: "Custom slug",           description: "Set a custom profile URL",                  points: 5,  met: !isDefaultSlug,              actionPath: "settings" },
      { label: "First certificate",     description: "Add at least 1 certificate",                points: 15, met: totalCerts >= 1,             actionPath: "add-cert" },
      { label: "3 certificates",        description: "Build up to 3 certificates",                points: 10, met: totalCerts >= 3,             actionPath: "add-cert" },
      { label: "Certificate with image",description: "Upload an image to a certificate",          points: 10, met: certsWithImage.length >= 1,  actionPath: "certificates" },
      { label: "Credential ID",         description: "Add a credential ID to a certificate",      points: 10, met: certsWithCredId.length >= 1, actionPath: "certificates" },
      { label: "2 domains",             description: "Certificates in 2 or more domains",         points: 10, met: uniqueDomains >= 2,          actionPath: "add-cert" },
      { label: "Public certificate",    description: "Make at least 1 certificate public",        points: 10, met: publicCerts.length >= 1,     actionPath: "certificates" },
      { label: "Annual goal set",       description: "Set an annual learning goal",               points: 5,  met: hasGoal,                     actionPath: "certificates" },
    ];
  }, [certificates, avatarUrl, bio, slug, hasGoal]);

  const score = useMemo(() => criteria.reduce((sum, c) => sum + (c.met ? c.points : 0), 0), [criteria]);
  const tier = getTierInfo(score);

  const incomplete = criteria
    .filter((c) => !c.met)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const handleAction = (actionPath?: "settings" | "add-cert" | "certificates") => {
    if (actionPath === "settings") router.push("/settings");
    else {
      const el = document.getElementById("certificates-panel");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--card-shadow)" }}
    >
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left transition-all hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none", background: "var(--surface-alt)" }}
      >
        <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-white/50 flex-1">
          Profile completeness
        </span>
        {/* Score pill */}
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full mr-1"
          style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
        >
          {score}/100
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
        <div className="p-4">
          {score === 100 ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.12)" }}>
                <svg className="w-4 h-4" style={{ color: "#10b981" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50">Your profile is fully complete and optimized.</p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {/* Ring */}
              <div className="shrink-0">
                <CircleProgress score={score} size={80} />
              </div>

              {/* Right side */}
              <div className="flex-1 min-w-0 flex flex-col gap-2.5 w-full">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}`, color: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>

                {/* Incomplete checklist */}
                {incomplete.length > 0 && (
                  <div className="space-y-1">
                    {incomplete.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => handleAction(c.actionPath)}
                        className="w-full flex items-center gap-2.5 text-left group rounded-xl px-2.5 py-1.5 transition-all
                          hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      >
                        <div className="w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-colors
                          border-slate-300 dark:border-white/20 group-hover:border-violet-500 dark:group-hover:border-violet-400" />
                        <span className="text-[11px] font-medium text-slate-600 dark:text-white/65 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex-1">
                          {c.description}
                        </span>
                        <span className="text-[10px] font-bold shrink-0 text-slate-300 dark:text-white/20">+{c.points}</span>
                        <svg className="w-3 h-3 shrink-0 text-slate-300 dark:text-white/20 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${score}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
