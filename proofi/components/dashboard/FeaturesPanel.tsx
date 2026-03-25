"use client";

import { useState } from "react";
import type { UserFeatures } from "@/lib/features";

interface Props {
  initialFeatures: UserFeatures;
}

interface FeatureDef {
  key: keyof UserFeatures;
  label: string;
  description: string;
  badge?: string;
}

const FEATURE_LIST: FeatureDef[] = [
  {
    key: "autoFillFromImage",
    label: "Auto-fill from image",
    description:
      "When you upload a certificate image or PDF, Proofi uses AI to automatically read and fill in the certificate name, issuer, dates, and credential ID. Only fills empty fields — never overwrites what you've typed.",
    badge: "AI",
  },
];

export default function FeaturesPanel({ initialFeatures }: Props) {
  const [features, setFeatures] = useState<UserFeatures>(initialFeatures);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggle = async (key: keyof UserFeatures) => {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features: updated }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeatures(features); // revert
        setSaveMsg({ type: "error", text: json.error || "Failed to save." });
      } else {
        setSaveMsg({ type: "success", text: "Feature settings saved." });
        setTimeout(() => setSaveMsg(null), 2500);
      }
    } catch {
      setFeatures(features); // revert
      setSaveMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Feature toggles card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="px-6 pt-6 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50">Smart Features</p>
          <p className="text-xs mt-1 text-slate-400 dark:text-white/35">
            All features are off by default. Enable the ones you want.
          </p>
        </div>

        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {FEATURE_LIST.map((feat, i) => (
            <div key={feat.key} className={`flex items-start gap-4 px-6 py-5 ${i === 0 ? "border-t" : ""}`} style={{ borderColor: "var(--border)" }}>
              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{feat.label}</p>
                  {feat.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide"
                      style={{
                        background: "rgba(124,58,237,0.12)",
                        color: "#7c3aed",
                        border: "1px solid rgba(124,58,237,0.2)",
                      }}>
                      {feat.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-white/50">{feat.description}</p>
              </div>

              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={features[feat.key]}
                onClick={() => toggle(feat.key)}
                disabled={saving}
                className={`relative shrink-0 mt-0.5 w-11 h-6 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  features[feat.key]
                    ? "bg-violet-600"
                    : "bg-black/[0.12] dark:bg-white/[0.12]"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    features[feat.key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save feedback */}
      {saveMsg && (
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
            saveMsg.type === "success"
              ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20"
              : "text-red-700 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/20"
          }`}
        >
          {saveMsg.type === "success" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {saveMsg.text}
        </div>
      )}
    </div>
  );
}
