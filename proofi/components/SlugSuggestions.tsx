"use client";

import { useEffect, useState } from "react";
import { generateSlugSuggestions } from "@/lib/slugSuggester";

interface SuggestionState {
  slug: string;
  status: "checking" | "available" | "taken";
}

interface Props {
  name: string;
  domains: string[];       // user's existing certificate domains
  currentSlug: string;     // currently typed slug value
  onApply: (slug: string) => void;
}

export default function SlugSuggestions({ name, domains, currentSlug, onApply }: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionState[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!name || name.trim().length < 2) {
      setSuggestions([]);
      setVisible(false);
      return;
    }

    const raw = generateSlugSuggestions(name, domains);
    if (raw.length === 0) { setVisible(false); return; }

    // Start with checking state
    const initial: SuggestionState[] = raw.map((s) => ({ slug: s, status: "checking" }));
    setSuggestions(initial);
    setVisible(true);

    // Check availability for each suggestion
    raw.forEach(async (slug, i) => {
      // Try slug, then slug-2, slug-3 until available or exhausted
      let found: string | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`;
        try {
          const res = await fetch(`/api/profile/check-slug?slug=${encodeURIComponent(candidate)}`);
          const json = await res.json();
          if (json.available) { found = candidate; break; }
        } catch {
          break;
        }
      }

      setSuggestions((prev) => {
        const next = [...prev];
        next[i] = found
          ? { slug: found, status: "available" }
          : { slug: raw[i], status: "taken" };
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      className="animate-in fade-in slide-in-from-top-1 duration-200"
      style={{ animationFillMode: "both" }}
    >
      <p className="text-[11px] font-semibold text-slate-400 dark:text-white/40 mb-2 mt-3">
        Suggestions
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => {
          const isActive = s.slug === currentSlug;
          const isChecking = s.status === "checking";
          const isTaken = s.status === "taken";

          return (
            <button
              key={i}
              disabled={isTaken || isChecking}
              onClick={() => !isTaken && !isChecking && onApply(s.slug)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                border transition-all duration-200
                ${isActive
                  ? "bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-400"
                  : isTaken
                  ? "opacity-40 cursor-not-allowed bg-black/[0.03] border-black/[0.07] text-slate-400 dark:bg-white/[0.03] dark:border-white/[0.08] dark:text-white/30"
                  : isChecking
                  ? "opacity-60 cursor-default bg-black/[0.04] border-black/[0.08] text-slate-500 dark:bg-white/[0.05] dark:border-white/[0.10] dark:text-white/50"
                  : "bg-black/[0.04] border-black/[0.08] text-slate-600 hover:bg-violet-500/10 hover:border-violet-500/30 hover:text-violet-600 dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white/65 dark:hover:bg-violet-500/12 dark:hover:border-violet-400/30 dark:hover:text-violet-400 cursor-pointer"
                }
              `}
            >
              {isChecking ? (
                <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : s.status === "available" ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              )}
              <span className="text-slate-400 dark:text-white/30">/</span>
              {s.slug}
            </button>
          );
        })}
      </div>
    </div>
  );
}
