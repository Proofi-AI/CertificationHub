"use client";

import { useState } from "react";

export type SortStrategy =
  | "recent"
  | "strongest"
  | "domain"
  | "expiring"
  | "alphabetical"
  | "custom";

const STRATEGIES: { value: SortStrategy; label: string; desc: string }[] = [
  { value: "recent",       label: "Most recent",    desc: "Newest certificates first" },
  { value: "strongest",    label: "Strongest first", desc: "Most complete certificates first" },
  { value: "domain",       label: "By domain",      desc: "Grouped by domain, then by date" },
  { value: "expiring",     label: "Expiring soon",  desc: "Certificates expiring soonest first" },
  { value: "alphabetical", label: "A – Z",          desc: "Alphabetical by certificate name" },
  { value: "custom",       label: "Custom order",   desc: "Drag to reorder manually" },
];

interface Props {
  value: SortStrategy;
  onChange: (s: SortStrategy) => void;
  isDirty: boolean;
  onSave: () => void;
  saving: boolean;
}

export default function SortControl({ value, onChange, isDirty, onSave, saving }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = STRATEGIES.find((s) => s.value === value)!;

  return (
    <>
      {/* Desktop: compact dropdown */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold text-slate-400 dark:text-white/40">Sort</span>
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as SortStrategy)}
            className="rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-none cursor-pointer appearance-none
              bg-black/[0.04] border border-black/[0.08] text-slate-700 hover:bg-black/[0.07] transition-all
              dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white/75 dark:hover:bg-white/[0.09]"
          >
            {STRATEGIES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>

        {isDirty && (
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200
              text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}
          >
            {saving ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            )}
            Save order
          </button>
        )}
      </div>

      {/* Mobile: icon button → bottom sheet */}
      <div className="sm:hidden flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-1.5 min-w-0 flex-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
            text-slate-600 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
            hover:bg-black/[0.08] dark:hover:bg-white/[0.10]"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          <span className="truncate">{current.label}</span>
        </button>
        {isDirty && (
          <button
            onClick={onSave}
            disabled={saving}
            className="shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {saving ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : "Save"}
          </button>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Sort certificates</p>
              <button onClick={() => setMobileOpen(false)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-2">
              {STRATEGIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { onChange(s.value); setMobileOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  <div>
                    <p className={`text-sm font-semibold ${value === s.value ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-white"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{s.desc}</p>
                  </div>
                  {value === s.value && (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
