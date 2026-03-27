"use client";

import { useState, useRef } from "react";
import type { Certificate } from "@prisma/client";
import { scoreCertificate, buildMissingTooltip } from "@/lib/certStrength";

interface Props {
  certificate: Certificate;
}

export default function CertificateStrengthBar({ certificate }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const strength = scoreCertificate(certificate);
  const tooltipText = buildMissingTooltip(strength);

  const handleTouchStart = () => {
    setShowTooltip(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowTooltip(false), 3000);
  };

  const handleClickOutside = () => {
    setShowTooltip(false);
  };

  return (
    <div className="relative">
      {/* Strength bar */}
      <div
        className="relative w-full h-[4px] cursor-help"
        style={{ background: "var(--border)" }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={handleTouchStart}
        onClick={(e) => {
          e.stopPropagation();
          setShowTooltip((v) => !v);
        }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${strength.widthPct}%`,
            background: strength.color,
          }}
        />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full mb-2 left-0 right-0 z-30 px-3 py-2 rounded-xl text-xs leading-snug shadow-xl pointer-events-none"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-hover)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            color: "var(--foreground)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ background: strength.color }}
            />
            <span className="font-bold text-[11px]" style={{ color: strength.color }}>
              {strength.label}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-white/40 ml-auto">
              {strength.score}/5
            </span>
          </div>
          <p className="text-slate-600 dark:text-white/60">{tooltipText}</p>
          {/* Arrow */}
          <div
            className="absolute -bottom-[5px] left-4 w-2.5 h-2.5 rotate-45"
            style={{
              background: "var(--surface)",
              borderRight: "1px solid var(--border-hover)",
              borderBottom: "1px solid var(--border-hover)",
            }}
          />
        </div>
      )}

      {/* Mobile dismiss overlay */}
      {showTooltip && (
        <div
          className="fixed inset-0 z-20 sm:hidden"
          onClick={handleClickOutside}
        />
      )}
    </div>
  );
}
