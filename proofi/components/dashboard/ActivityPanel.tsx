"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Certificate } from "@prisma/client";

interface Props {
  certificates: Certificate[];
  onEditCertificate: (cert: Certificate) => void;
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

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

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

  const days   = daysInMonth(year, month);
  const offset = startOfMonth(year, month).getDay(); // 0=Sun
  const now    = new Date();

  // Map day → certs
  const issuedMap  = useMemo<Map<number, Certificate[]>>(() => {
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
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const issued  = issuedMap.get(day);
          const expiring = expiryMap.get(day);
          const isToday = isSameDay(new Date(year, month, day), today);

          // Determine dot color
          let dotColor = "";
          if (expiring) {
            const d = toDate(expiring[0].expiresAt)!;
            const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
            dotColor = diff < 0 ? "bg-red-500" : diff <= 14 ? "bg-red-400" : "bg-amber-400";
          } else if (issued) {
            dotColor = "bg-violet-500";
          }

          return (
            <button
              key={day}
              onClick={() => handleDay(day)}
              className={`relative flex flex-col items-center justify-center rounded-lg h-8 text-xs font-medium transition-all
                ${isToday
                  ? "bg-violet-600 text-white font-bold"
                  : (issued || expiring)
                    ? "text-slate-800 dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer"
                    : "text-slate-500 dark:text-white/40 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
            >
              {day}
              {dotColor && !isToday && (
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

/* ─── sub-component: Heatmap ──────────────────────────────────────────── */

function ActivityHeatmap({ certificates }: { certificates: Certificate[] }) {
  const today = new Date();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Build 52-week grid ending today
  const weeks = useMemo(() => {
    const end = new Date(today);
    // Align to Saturday so grid fills neatly
    const endSat = new Date(end);
    endSat.setDate(end.getDate() + (6 - end.getDay()));

    const countMap = new Map<string, number>();
    certificates.forEach((c) => {
      const d = toDate(c.issuedAt);
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    });

    const result: { date: Date; count: number }[][] = [];
    let cursor = new Date(endSat);
    cursor.setDate(cursor.getDate() - 52 * 7 + 1);

    for (let w = 0; w < 52; w++) {
      const week: { date: Date; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(cursor);
        const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
        week.push({ date: day, count: countMap.get(key) ?? 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [certificates]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const m = week[0].date.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: MONTHS[m], col: wi });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  const cellColor = (count: number) => {
    if (count === 0) return "bg-black/[0.06] dark:bg-white/[0.06]";
    if (count === 1) return "bg-violet-300 dark:bg-violet-700";
    if (count === 2) return "bg-violet-400 dark:bg-violet-600";
    return "bg-violet-600 dark:bg-violet-400";
  };

  return (
    <div className="relative">
      {/* Month row */}
      <div className="relative h-4 mb-1" style={{ display: "grid", gridTemplateColumns: `repeat(52, 1fr)` }}>
        {monthLabels.map(({ label, col }) => (
          <span
            key={`${label}-${col}`}
            className="absolute text-[10px] text-slate-400 dark:text-white/30 font-medium"
            style={{ left: `${(col / 52) * 100}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        className="overflow-x-auto pb-1"
        style={{ display: "grid", gridTemplateColumns: `repeat(52, 1fr)`, gap: "2px" }}
      >
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[2px]">
            {week.map(({ date, count }, di) => (
              <div
                key={di}
                className={`w-full aspect-square rounded-[2px] cursor-default transition-opacity hover:opacity-80 ${cellColor(count)}`}
                style={{ minWidth: 10, minHeight: 10 }}
                onMouseEnter={(e) => {
                  if (count === 0) return;
                  const rect = (e.target as HTMLElement).getBoundingClientRect();
                  const parentRect = (e.target as HTMLElement).closest(".heatmap-root")?.getBoundingClientRect();
                  setTooltip({
                    text: `${count} cert${count > 1 ? "s" : ""} on ${MONTHS[date.getMonth()]} ${date.getDate()}`,
                    x: rect.left - (parentRect?.left ?? 0),
                    y: rect.top - (parentRect?.top ?? 0) - 28,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none z-10 px-2 py-1 rounded-lg text-[11px] font-medium text-white shadow-lg"
          style={{
            background: "rgba(15,10,30,0.85)",
            left: tooltip.x,
            top: tooltip.y,
            whiteSpace: "nowrap",
            transform: "translateX(-50%)",
          }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 justify-end">
        <span className="text-[10px] text-slate-400 dark:text-white/30">Less</span>
        {["bg-black/[0.06] dark:bg-white/[0.06]", "bg-violet-300 dark:bg-violet-700", "bg-violet-400 dark:bg-violet-600", "bg-violet-600 dark:bg-violet-400"].map((c, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-[2px] ${c}`} />
        ))}
        <span className="text-[10px] text-slate-400 dark:text-white/30">More</span>
      </div>
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
  const r   = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const met  = certsThisYear >= goal;

  const commitGoal = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n > 0) {
      setGoal(n);
      localStorage.setItem("proofi_annual_goal", String(n));
    }
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg width="72" height="72" className="-rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            className="stroke-black/[0.08] dark:stroke-white/[0.08]" />
          <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6"
            stroke={met ? "#10b981" : "#7c3aed"}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-black leading-none ${met ? "text-emerald-500" : "text-slate-800 dark:text-white"}`}>
            {certsThisYear}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 mt-0.5">/{goal}</span>
        </div>
      </div>

      {/* Label */}
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-white">
          {met ? "Goal reached! 🎉" : `${goal - certsThisYear} more to go`}
        </p>
        <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">Annual goal</p>
        {editing ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              autoFocus
              type="number"
              min={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitGoal(); if (e.key === "Escape") setEditing(false); }}
              className="w-14 rounded-lg border px-2 py-1 text-xs outline-none
                bg-black/[0.04] border-black/[0.10] text-slate-800
                dark:bg-white/[0.06] dark:border-white/[0.12] dark:text-white"
            />
            <button onClick={commitGoal} className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">Save</button>
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(goal)); setEditing(true); }}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline mt-1"
          >
            Edit goal
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── main component ──────────────────────────────────────────────────── */

export default function ActivityPanel({ certificates, onEditCertificate }: Props) {
  const today = new Date();
  const [calYear,  setCalYear]  = useState(today.getFullYear());
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
    <div className="space-y-4 heatmap-root">

      {/* ── Calendar ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
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
        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Issued</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Expiring</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className="text-[10px] text-slate-500 dark:text-white/40">Expired</span>
          </div>
        </div>
      </div>

      {/* ── Stats row: streak + this month ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-start gap-2">
            <span className="text-2xl leading-none mt-0.5">🔥</span>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{currentStreak}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mt-1">Month streak</p>
              {bestStreak > 1 && (
                <p className="text-[11px] text-slate-400 dark:text-white/35 mt-0.5">Best: {bestStreak}</p>
              )}
            </div>
          </div>
        </div>

        {/* This month */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{thisMonthCerts.length}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/40 mt-1">This month</p>
            <div className="flex items-center gap-1 mt-0.5">
              {thisMonthDelta !== 0 && (
                <span className={`text-[11px] font-semibold ${thisMonthDelta > 0 ? "text-emerald-500" : "text-slate-400 dark:text-white/30"}`}>
                  {thisMonthDelta > 0 ? "↑" : "↓"}{Math.abs(thisMonthDelta)} vs last
                </span>
              )}
              {thisMonthDelta === 0 && lastMonthCerts.length > 0 && (
                <span className="text-[11px] text-slate-400 dark:text-white/30">Same as last</span>
              )}
              {thisMonthDelta === 0 && lastMonthCerts.length === 0 && (
                <span className="text-[11px] text-slate-400 dark:text-white/30">—</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Velocity badge ── */}
      <div
        className="rounded-2xl p-4 flex items-center justify-between"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-xs font-bold text-slate-500 dark:text-white/45 uppercase tracking-wide">Learning velocity</p>
          <p className={`text-sm font-bold mt-0.5 ${velocity.color}`}>{velocity.icon} {velocity.label}</p>
        </div>
      </div>

      {/* ── Annual goal ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <GoalRing certsThisYear={certsThisYear} />
      </div>

      {/* ── Heatmap ── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">12-month activity</h3>
        </div>
        <div className="overflow-x-auto">
          <ActivityHeatmap certificates={certificates} />
        </div>
      </div>

      {/* ── Expiry alerts ── */}
      {expiryAlerts.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Expiry alerts
          </h3>
          <div className="space-y-2">
            {expiryAlerts.map(({ cert, diff }) => {
              const isExpired  = diff < 0;
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
                  className="w-full text-left rounded-xl p-3 transition-all hover:opacity-90"
                  style={{ background: color.bg, border: `1px solid ${color.border}` }}
                >
                  <p className="text-xs font-semibold text-slate-800 dark:text-white leading-snug">{cert.name}</p>
                  <p className={`text-[11px] font-bold mt-0.5 ${color.text}`}>
                    {isExpired
                      ? `Expired ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} ago`
                      : diff === 0
                      ? "Expires today"
                      : `Expires in ${diff} day${diff !== 1 ? "s" : ""}`}
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
