"use client";

import type { Certificate } from "@prisma/client";
import { DOMAIN_ACCENT } from "@/lib/constants";

interface Props {
  certificates: Certificate[];
  onCertClick: (cert: Certificate) => void;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export default function CertificatePinnedShelf({ certificates, onCertClick }: Props) {
  const featured = certificates.filter((c) => c.isFeatured).slice(0, 3);
  if (featured.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Pinned label */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500/80">Pinned</span>
      </div>

      {/* Compact horizontal cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {featured.map((cert) => {
          const accent = DOMAIN_ACCENT[cert.domain] ?? DOMAIN_ACCENT["Other"];
          const isPdf = cert.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
          const issuerInitials = (cert.issuer || "?")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <button
              key={cert.id}
              type="button"
              onClick={() => onCertClick(cert)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid rgba(245,158,11,0.6)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              {/* Thumbnail with amber ring */}
              <div
                className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                style={{ boxShadow: "0 0 0 1.5px rgba(245,158,11,0.55)" }}
              >
                {cert.imageUrl && !isPdf ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cert.imageUrl} alt={cert.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }}
                  >
                    {issuerInitials}
                  </div>
                )}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {cert.name}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-white/40 truncate mt-0.5">
                  {cert.issuer}
                  {cert.issuedAt ? (
                    <span className="text-slate-300 dark:text-white/20"> · {formatDate(cert.issuedAt)}</span>
                  ) : null}
                </p>
                {cert.verifyStatus === "ai_verified" && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-teal-600 dark:text-teal-400 mt-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    AI Verified
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
