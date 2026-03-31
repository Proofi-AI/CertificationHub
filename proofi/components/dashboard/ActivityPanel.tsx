"use client";

import { useState, useEffect, useMemo } from "react";
import type { Certificate } from "@prisma/client";

interface Props {
  certificates: Certificate[];
  onEditCertificate: (cert: Certificate) => void;
  profileViews: number;
  slug: string;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfMonth(y: number, m: number) { return new Date(y, m, 1); }
function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─── sub-component: Calendar ─────────────────────────────────────────── */

function MiniCalendar({
  year, month, certificates, onEditCertificate,
}: {
  year: number; month: number;
  certificates: Certificate[];
  onEditCertificate: (c: Certificate) => void;
}) {
  const [popup, setPopup] = useState<{ day: number; certs: Certificate[] } | null>(null);
  const today = new Date();

  const days = daysInMonth(year, month);
  const offset = startOfMonth(year, month).getDay(); // 0=Sun
  const now = new Date();

  // Map day → certs
  const issuedMap = useMemo<Map<number, Certificate[]>>(() => {
    const m = new Map<number, Certificate[]>();
    certificates.forEach((c) => {
      const d = toDate(c.issuedAt);
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const k = d.getDate();
        m.set(k, [...(m.get(k) ?? []), c]);
      }
    });
    return m;
  }, [certificates, year, month]);

  const expiryMap = useMemo<Map<number, Certificate[]>>(() => {
    const m = new Map<number, Certificate[]>();
    certificates.forEach((c) => {
      const d = toDate(c.expiresAt);
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const k = d.getDate();
        m.set(k, [...(m.get(k) ?? []), c]);
      }
    });
    return m;
  }, [certificates, year, month]);

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  const handleDay = (day: number) => {
    const certs = [
      ...(issuedMap.get(day) ?? []),
      ...(expiryMap.get(day) ?? []),
    ];
    if (certs.length === 0) { setPopup(null); return; }
    setPopup({ day, certs });
  };

  return (
    <div className="relative">
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30 py-0.5">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const issued = issuedMap.get(day);
          const expiring = expiryMap.get(day);
          const isToday = isSameDay(new Date(year, month, day), today);

          // Determine dot color
          // Expiry: past → red, today or future → amber. Issue: violet.
          let dotColor = "";
          if (expiring) {
            const cellDate = new Date(year, month, day);
            const isPast = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            dotColor = isPast ? "bg-red-500" : "bg-amber-400";
          } else if (issued) {
            dotColor = "bg-violet-500";
          }

          return (
            <button
              key={day}
              onClick={() => handleDay(day)}
              className={`relative flex flex-col items-center justify-center rounded-md h-6 text-[11px] font-medium transition-all
                ${isToday
                  ? "bg-violet-600 text-white font-bold"
                  : (issued || expiring)
                    ? "text-slate-800 dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                    : "text-slate-500 dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
            >
              {day}
              {dotColor && (
                <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dotColor}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Popup */}
      {popup && (
        <div
          className="absolute left-0 right-0 z-10 mt-2 rounded-xl p-3 shadow-xl text-sm"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wide">
              {MONTHS[month]} {popup.day}
            </span>
            <button
              onClick={() => setPopup(null)}
              className="text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {popup.certs.map((c) => {
              const isExpiring = expiryMap.get(popup.day)?.some((x) => x.id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => { onEditCertificate(c); setPopup(null); }}
                  className="w-full text-left rounded-lg px-2.5 py-2 transition-all hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                >
                  <p className="font-semibold text-slate-800 dark:text-white text-xs leading-snug">{c.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5">
                    {isExpiring ? "⚠ Expires" : "✓ Issued"} — {c.issuer}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── sub-component: Monthly bar chart ───────────────────────────────── */

function MonthlyBarChart({
  certificates,
  year,
}: {
  certificates: Certificate[];
  year: number;
}) {
  const today = new Date();
  const [hovered, setHovered] = useState<number | null>(null);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const bars = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const count = certificates.filter((c) => {
        const issued = toDate(c.issuedAt);
        return issued && issued.getFullYear() === year && issued.getMonth() === m;
      }).length;
      // Future months in the current year are "pending"
      const isFuture = year === currentYear && m > currentMonth;
      return { label: MONTHS[m], year, month: m, count, isFuture };
    });
  }, [certificates, year]);

  const maxCount = Math.max(...bars.map((b) => b.count), 1);

  return (
    <div className="relative pt-5">
      {/* Bars */}
      <div className="flex items-end gap-[3px] h-14">
        {bars.map((bar, i) => {
          const isCurrentMonth = year === currentYear && i === currentMonth;
          const heightPct = bar.count === 0 ? 0 : Math.max((bar.count / maxCount) * 100, 12);
          const isHovered = hovered === i;

          return (
            <div
              key={i}
              className="relative flex-1 flex flex-col items-center justify-end h-full cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Count label — shown on hover or always for current month */}
              {bar.count > 0 && (isHovered || isCurrentMonth) && (
                <span
                  className="absolute -top-4 text-[10px] font-bold leading-none"
                  style={{ color: isCurrentMonth ? "#7c3aed" : "var(--muted)" }}
                >
                  {bar.count}
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{
                  height: bar.count === 0 ? "3px" : `${heightPct}%`,
                  background: bar.count === 0
                    ? bar.isFuture
                      ? "transparent"
                      : "var(--border)"
                    : isCurrentMonth
                      ? "linear-gradient(to top, #6d28d9, #a78bfa)"
                      : isHovered
                        ? "linear-gradient(to top, rgba(124,58,237,0.7), rgba(167,139,250,0.7))"
                        : "linear-gradient(to top, rgba(124,58,237,0.3), rgba(167,139,250,0.3))",
                  borderRadius: bar.count === 0 ? "2px" : undefined,
                  opacity: bar.isFuture ? 0 : bar.count === 0 ? 0.35 : 1,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-[3px] mt-1">
        {bars.map((bar, i) => {
          const isCurrentMonth = year === currentYear && i === currentMonth;
          return (
            <div
              key={i}
              className="flex-1 text-center text-[8px] font-semibold leading-none"
              style={{
                color: isCurrentMonth ? "#7c3aed" : "var(--muted)",
                opacity: bar.isFuture ? 0.25 : isCurrentMonth ? 1 : 0.6,
              }}
            >
              {bar.label[0]}
            </div>
          );
        })}
      </div>

      {/* Hover tooltip */}
      {hovered !== null && bars[hovered].count > 0 && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-10 px-2 py-0.5 rounded-md text-[10px] font-semibold text-white whitespace-nowrap shadow-lg"
          style={{ background: "rgba(15,10,30,0.82)" }}
        >
          {bars[hovered].count} cert{bars[hovered].count !== 1 ? "s" : ""} · {bars[hovered].label} {year}
        </div>
      )}
    </div>
  );
}

/* ─── sub-component: Activity bar card (owns year nav state) ─────────── */

function ActivityBarCard({ certificates }: { certificates: Certificate[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const isCurrentYear = year === currentYear;

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Activity</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-black/[0.07] dark:hover:bg-white/[0.09]"
          >
            <svg className="w-3 h-3 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-[11px] font-bold text-slate-600 dark:text-white/70 tabular-nums w-9 text-center">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            disabled={isCurrentYear}
            className="w-5 h-5 rounded flex items-center justify-center transition-all hover:bg-black/[0.07] dark:hover:bg-white/[0.09] disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <svg className="w-3 h-3 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
      <MonthlyBarChart certificates={certificates} year={year} />
    </div>
  );
}

/* ─── sub-component: Goal Ring ────────────────────────────────────────── */

function GoalRing({ certsThisYear }: { certsThisYear: number }) {
  const [goal, setGoal] = useState<number>(12);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("12");

  useEffect(() => {
    const stored = localStorage.getItem("proofi_annual_goal");
    if (stored) { const n = parseInt(stored, 10); if (!isNaN(n) && n > 0) setGoal(n); }
  }, []);

  const pct = Math.min(certsThisYear / goal, 1);
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const met = certsThisYear >= goal;

  const commitGoal = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("proofi_annual_goal", String(n));
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="56" height="56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5"
            className="stroke-black/[0.08] dark:stroke-white/[0.08]" />
          <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5"
            stroke={met ? "#10b981" : "#7c3aed"}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-black leading-none ${met ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}>
            {certsThisYear}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-white/30">/{goal}</span>
        </div>
      </div>

      {/* Label */}
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-white">
          {met ? "Goal reached! 🎉" : `${goal - certsThisYear} more to go`}
        </p>
        <p className="text-[11px] text-slate-500 dark:text-white/50 mt-0.5">Annual goal</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              autoFocus
              type="number"
              min={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitGoal(); if (e.key === "Escape") setEditing(false); }}
              className="w-12 rounded-md border px-1.5 py-0.5 text-xs outline-none
                bg-black/[0.04] border-black/[0.10] text-slate-800
                dark:bg-white/[0.06] dark:border-white/[0.12] dark:text-white"
            />
            <button onClick={commitGoal} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">Save</button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(goal)); setEditing(true); }}
            className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline mt-0.5"
          >
            Edit goal
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────── */

export default function ActivityPanel({ certificates, onEditCertificate, profileViews, slug }: Props) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  /* ── Stats ── */
  const thisMonthCerts = useMemo(() => {
    const y = today.getFullYear(), m = today.getMonth();
    return certificates.filter((c) => {
      const d = toDate(c.issuedAt);
      return d && d.getFullYear() === y && d.getMonth() === m;
    });
  }, [certificates]);

  const lastMonthCerts = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return certificates.filter((c) => {
      const issued = toDate(c.issuedAt);
      return issued && issued.getFullYear() === d.getFullYear() && issued.getMonth() === d.getMonth();
    });
  }, [certificates]);

  const certsThisYear = useMemo(() => {
    return certificates.filter((c) => {
      const d = toDate(c.issuedAt);
      return d && d.getFullYear() === today.getFullYear();
    }).length;
  }, [certificates]);

  /* ── Streak (consecutive months) ── */
  const { currentStreak, bestStreak } = useMemo(() => {
    if (certificates.length === 0) return { currentStreak: 0, bestStreak: 0 };

    const set = new Set<string>();
    certificates.forEach((c) => {
      const d = toDate(c.issuedAt);
      if (d) set.add(`${d.getFullYear()}-${d.getMonth()}`);
    });

    let cur = 0;
    const y = today.getFullYear();
    const m = today.getMonth();
    // Walk backwards from this month
    let cy = y, cm = m;
    while (set.has(`${cy}-${cm}`)) {
      cur++;
      if (cm === 0) { cy--; cm = 11; } else cm--;
    }

    // Best: find longest run in sorted month list
    const sorted = Array.from(set).map((k) => {
      const [ky, km] = k.split("-").map(Number);
      return ky * 12 + km;
    }).sort((a, b) => a - b);

    let best = 0, run = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] === sorted[i - 1] + 1) { run++; } else { run = 1; }
      if (run > best) best = run;
    }

    return { currentStreak: cur, bestStreak: best };
  }, [certificates]);

  /* ── Velocity badge ── */
  const velocity = useMemo(() => {
    const t = thisMonthCerts.length;
    const l = lastMonthCerts.length;
    const total = certificates.length;

    if (total === 0) return { label: "Getting started", color: "text-slate-400 dark:text-white/40", icon: "🌱" };
    if (t > l && l > 0) return { label: "Accelerating", color: "text-emerald-600 dark:text-emerald-400", icon: "🚀" };
    if (t === l && l > 0) return { label: "Consistent", color: "text-violet-600 dark:text-violet-400", icon: "⚡" };
    if (t < l && l > 0) return { label: "Slowing down", color: "text-amber-600 dark:text-amber-400", icon: "📉" };
    return { label: "Getting started", color: "text-slate-400 dark:text-white/40", icon: "🌱" };
  }, [thisMonthCerts, lastMonthCerts, certificates]);

  /* ── Expiry alerts ── */
  const expiryAlerts = useMemo(() => {
    const now = today.getTime();
    return certificates
      .filter((c) => {
        const d = toDate(c.expiresAt);
        if (!d) return false;
        const diff = Math.ceil((d.getTime() - now) / 86400000);
        return diff <= 60;
      })
      .map((c) => {
        const d = toDate(c.expiresAt)!;
        const diff = Math.ceil((d.getTime() - now) / 86400000);
        return { cert: c, diff };
      })
      .sort((a, b) => a.diff - b.diff);
  }, [certificates]);

  /* ── Calendar nav ── */
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };
  const isCurrentMonth = calYear === today.getFullYear() && calMonth === today.getMonth();

  const thisMonthDelta = thisMonthCerts.length - lastMonthCerts.length;

  return (
    <div className="space-y-3 heatmap-root">

      {/* ── Profile views card ── */}
      {/* <div
        className="rounded-xl p-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white">Your profile</h3>
        </div>
        <div className="truncate mb-2">
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-violet-600 dark:text-violet-400 hover:underline truncate"
          >
            proofihub.vercel.app/{slug}
          </a>
        </div>
        {profileViews > 0 ? (
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-slate-400 dark:text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] font-semibold text-slate-700 dark:text-white/65">
              {profileViews.toLocaleString()} profile {profileViews === 1 ? "view" : "views"}
            </span>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-white/35">No views yet — share your profile to get started.</p>
        )}
      </div> */}

      {/* ── Calendar ── */}
      <div
        className="rounded-2xl p-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-800 dark:text-white">
            {MONTHS[calMonth]} {calYear}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); }}
                className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline px-1"
              >
                Today
              </button>
            )}
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>

        <MiniCalendar
          year={calYear}
          month={calMonth}
          certificates={certificates}
          onEditCertificate={onEditCertificate}
        />

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Issued</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Expiring</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Expired</span>
          </div>
        </div>
      </div>

      {/* ── Stats row: streak + this month ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Streak */}
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">🔥</span>
            <div>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{currentStreak}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mt-0.5">Monthly streak</p>
              {bestStreak > 1 && (
                <p className="text-[10px] text-slate-400 dark:text-white/30">Best: {bestStreak}</p>
              )}
            </div>
          </div>
        </div>

        {/* This month */}
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-lg font-black text-slate-900 dark:text-white leading-none">{thisMonthCerts.length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mt-0.5">This month</p>
          <div className="flex items-center gap-1 mt-0.5">
            {thisMonthDelta !== 0 && (
              <span className={`text-[10px] font-semibold ${thisMonthDelta > 0 ? "text-emerald-500" : "text-red-500 dark:text-red-400"}`}>
                {thisMonthDelta > 0 ? "↑" : "↓"}{Math.abs(thisMonthDelta)} vs last
              </span>
            )}
            {thisMonthDelta === 0 && (
              <span className="text-[10px] text-slate-400 dark:text-white/30">
                {lastMonthCerts.length > 0 ? "Same as last" : "—"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Velocity + Goal ring in one card ── */}
      <div
        className="rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-[10px] font-bold text-slate-500 dark:text-white/45 uppercase tracking-wide">Velocity</p>
          <p className={`text-xs font-bold mt-0.5 ${velocity.color}`}>{velocity.icon} {velocity.label}</p>
        </div>
        <div style={{ borderLeft: "1px solid var(--border)" }} className="pl-3">
          <GoalRing certsThisYear={certsThisYear} />
        </div>
      </div>

      {/* ── Monthly bar chart ── */}
      <ActivityBarCard certificates={certificates} />

      {/* ── Expiry alerts ── */}
      {expiryAlerts.length > 0 && (
        <div
          className="rounded-xl p-3"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Expiry alerts
          </h3>
          <div className="space-y-1.5">
            {expiryAlerts.map(({ cert, diff }) => {
              const isExpired = diff < 0;
              const isCritical = diff >= 0 && diff <= 14;
              const color = isExpired
                ? { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", text: "text-red-600 dark:text-red-400" }
                : isCritical
                  ? { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.14)", text: "text-red-500 dark:text-red-400" }
                  : { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", text: "text-amber-600 dark:text-amber-400" };

              return (
                <button
                  key={cert.id}
                  onClick={() => onEditCertificate(cert)}
                  className="w-full text-left rounded-lg px-2.5 py-2 transition-all hover:opacity-90"
                  style={{ background: color.bg, border: `1px solid ${color.border}` }}
                >
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-white leading-snug truncate">{cert.name}</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${color.text}`}>
                    {isExpired
                      ? `Expired ${Math.abs(diff)}d ago`
                      : diff === 0
                        ? "Expires today"
                        : `Expires in ${diff}d`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
