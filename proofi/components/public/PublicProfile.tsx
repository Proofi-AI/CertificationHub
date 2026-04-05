"use client";

import { useEffect, useRef, useState } from "react";
import type { Badge, Certificate, User } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_ACCENT } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import CertificateLightbox from "@/components/CertificateLightbox";
import BadgeWall from "@/components/BadgeWall";
import BadgeTrophyShelf from "@/components/BadgeTrophyShelf";
import BadgeLightbox from "@/components/BadgeLightbox";
import CertificatePinnedShelf from "@/components/CertificatePinnedShelf";

type PublicUser = Omit<User, "email"> & { certificates: Certificate[]; badges: Badge[] };

interface Props {
  profile: PublicUser;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function PublicCertCard({
  cert,
  onImageClick,
}: {
  cert: Certificate;
  onImageClick: (cert: Certificate) => void;
}) {
  const [descExpanded, setDescExpanded] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!descExpanded) return;
    const handler = (e: MouseEvent) => {
      if (descRef.current && !descRef.current.contains(e.target as Node)) {
        setDescExpanded(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [descExpanded]);
  const colors = DOMAIN_COLORS[cert.domain] ?? DOMAIN_COLORS["Other"];
  const accent = DOMAIN_ACCENT[cert.domain] ?? DOMAIN_ACCENT["Other"];
  const isPdf = cert.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* Domain accent bar */}
      <div className="h-[3px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

      {/* Preview */}
      {cert.imageUrl ? (
        <button
          type="button"
          onClick={() => onImageClick(cert)}
          className="w-full relative overflow-hidden block group"
          style={{ aspectRatio: "3/2", background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
          title="View full size"
        >
          {isPdf ? (
            <div className="absolute inset-0 overflow-hidden bg-[#f8f8fa] dark:bg-[#111]">
              <iframe
                src={`${cert.imageUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full pointer-events-none"
                style={{ border: "none" }}
                title={cert.name}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cert.imageUrl}
              alt={cert.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          )}
        </button>
      ) : (
        <div className="h-24 flex items-center justify-center" style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}>
          <svg className="w-8 h-8 text-slate-300 dark:text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
          </svg>
        </div>
      )}

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col gap-3">
        {/* Domain badge */}
        <span className={`inline-flex items-center gap-1.5 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} tracking-wide`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent.from }} />
          {cert.domain}
        </span>

        {/* Name & issuer */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] leading-snug line-clamp-2 text-slate-900 dark:text-white/90">{cert.name}</h3>
          <p className="text-[13px] mt-1 truncate text-slate-500 dark:text-white/40">{cert.issuer}</p>
        </div>

        {/* Description */}
        {cert.description && (
          <div className="relative" ref={descRef}>
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="flex items-center gap-1.5 w-full text-left"
            >
              <span className="text-[12px] text-slate-400 dark:text-white/30 truncate flex-1">
                {cert.description}
              </span>
              <svg
                className={`w-3 h-3 shrink-0 text-slate-300 dark:text-white/20 transition-transform duration-200 ${descExpanded ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {descExpanded && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl p-3"
                style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
              >
                <p className="text-[12px] leading-relaxed text-slate-500 dark:text-white/50 whitespace-pre-wrap break-words">
                  {cert.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-white/25">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
          </svg>
          <span>{formatDate(cert.issuedAt)}</span>
          <span className="text-slate-200 dark:text-white/10">·</span>
          <span>{cert.expiresAt ? `Exp. ${formatDate(cert.expiresAt)}` : "No expiry"}</span>
        </div>

        {cert.credentialId && (
          <p className="text-xs font-mono truncate text-slate-400 dark:text-white/20">ID: {cert.credentialId}</p>
        )}

        {/* View button */}
        {cert.imageUrl && (
          <button
            type="button"
            onClick={() => onImageClick(cert)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-all duration-200
              text-slate-500 hover:text-slate-900 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.06] hover:border-black/[0.12]
              dark:text-white/40 dark:hover:text-white/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:border-white/[0.06] dark:hover:border-white/[0.14]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            View full size
          </button>
        )}
      </div>
    </div>
  );
}

export default function PublicProfile({ profile }: Props) {
  const [theme, setTheme] = useState<"dark" | "light">(
    (profile.defaultTheme as "dark" | "light") ?? "dark"
  );
  const [lightboxCert, setLightboxCert] = useState<Certificate | null>(null);
  const [lightboxBadge, setLightboxBadge] = useState<Badge | null>(null);
  const [activeTab, setActiveTab] = useState("All");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const publicCerts = profile.certificates.filter((c) => c.isPublic);
  const publicBadges = profile.badges?.filter((b) => b.isPublic) ?? [];

  // Domains from both certificates and badges
  const certDomains = new Set(publicCerts.map((c) => c.domain));
  const badgeDomains = new Set(publicBadges.map((b) => b.domain).filter(Boolean) as string[]);
  const allDomains = ["All", ...Array.from(new Set([...certDomains, ...badgeDomains]))];

  const filteredCerts = activeTab === "All" ? publicCerts : publicCerts.filter((c) => c.domain === activeTab);
  const filteredBadges = activeTab === "All" ? publicBadges : publicBadges.filter((b) => b.domain === activeTab);

  const initials = (profile.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const updatedAt = new Date(profile.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--foreground)" }}>

        {/* Background glows */}
        <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-50 dark:opacity-100"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)" }} />
        <div className="fixed bottom-0 right-1/4 w-80 h-80 rounded-full blur-[120px] pointer-events-none opacity-30 dark:opacity-60"
          style={{ background: "radial-gradient(circle, rgba(79,70,229,0.06), transparent 70%)" }} />

        {/* Sticky nav */}
        <nav
          className="sticky top-0 z-10"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--nav-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/ProofiLogo.png" alt="Proofi AI" width={42} height={42} className="rounded-lg" />
              <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md
                text-violet-600 bg-violet-500/10 border border-violet-500/20
                dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/20">
                beta
              </span>
            </Link>

            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200
                  text-slate-500 hover:text-slate-800 hover:bg-black/[0.06]
                  dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/[0.06]"
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                )}
              </button>

              <Link
                href="/signup"
                className="text-xs font-semibold px-3 sm:px-4 py-1.5 rounded-full text-white transition-all whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}
              >
                <span className="hidden sm:inline">Create your profile</span>
                <span className="sm:hidden">Get started</span>
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

          {/* Profile header */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 mb-7 sm:mb-10"
            style={{ animation: "fadeInUp 0.4s ease forwards" }}
          >
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden shrink-0"
              style={{ boxShadow: "0 0 0 2px rgba(124,58,237,0.45), 0 0 0 5px rgba(124,58,237,0.08), 0 8px 24px rgba(0,0,0,0.15)" }}
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt={profile.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  {initials}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black tracking-tight mb-1 text-slate-900 dark:text-white">{profile.name}</h1>
              {profile.bio && (
                <p className="text-sm leading-relaxed mb-2 max-w-lg text-slate-500 dark:text-white/50">{profile.bio}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-slate-400 dark:text-white/30">Updated {updatedAt}</span>
                <span className="text-slate-300 dark:text-white/15">·</span>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
                  {publicCerts.length} certificate{publicCerts.length !== 1 ? "s" : ""}
                </span>
                {publicBadges.length > 0 && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 dark:text-cyan-400">
                    {publicBadges.length} badge{publicBadges.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Domain filter tabs */}
          {allDomains.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {allDomains.map((domain) => (
                <button
                  key={domain}
                  onClick={() => setActiveTab(domain)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${activeTab === domain
                      ? "bg-violet-500/10 text-violet-600 border-violet-500/30 dark:bg-violet-600/25 dark:text-violet-300 dark:border-violet-500/40"
                      : "bg-black/[0.04] text-slate-500 border-black/[0.08] hover:border-black/[0.16] hover:text-slate-700 dark:bg-white/5 dark:text-white/40 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white/60"
                    }`}
                >
                  {domain}
                </button>
              ))}
            </div>
          )}

          {/* Badges section */}
          {filteredBadges.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Badges &amp; Credentials</h2>
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>

              {/* Trophy shelf — featured badges */}
              <BadgeTrophyShelf
                badges={filteredBadges}
                onBadgeClick={setLightboxBadge}
              />

              {/* Hex badge wall */}
              <BadgeWall
                badges={filteredBadges.filter((b) => !b.isFeatured)}
                onBadgeClick={setLightboxBadge}
              />
            </div>
          )}

          {/* Certificate grid */}
          {filteredCerts.length === 0 && filteredBadges.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm text-slate-400 dark:text-white/40">No public content in this category.</p>
            </div>
          )}

          {filteredCerts.length > 0 && (
            <>
              {filteredBadges.length > 0 && (
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-5">Certificates</h2>
              )}

              {/* Pinned shelf — featured certificates */}
              <CertificatePinnedShelf
                certificates={filteredCerts}
                onCertClick={setLightboxCert}
              />

              {/* Certificate grid — non-featured only */}
              {filteredCerts.filter((c) => !c.isFeatured).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {filteredCerts.filter((c) => !c.isFeatured).map((cert) => (
                    <PublicCertCard key={cert.id} cert={cert} onImageClick={setLightboxCert} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Footer CTA */}
          <div className="mt-16 text-center rounded-2xl p-8" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm mb-3 text-slate-400 dark:text-white/40">Powered by Proofi AI</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-white font-semibold px-6 py-2.5 rounded-full text-sm transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
            >
              Create your own profile — free
            </Link>
          </div>
        </main>

        {/* Certificate Lightbox */}
        {lightboxCert?.imageUrl && (
          <CertificateLightbox
            src={lightboxCert.imageUrl}
            alt={`${lightboxCert.name} — ${lightboxCert.issuer}`}
            isPdf={lightboxCert.imageUrl.toLowerCase().endsWith(".pdf")}
            onClose={() => setLightboxCert(null)}
          />
        )}

        {/* Badge Lightbox */}
        {lightboxBadge && (
          <BadgeLightbox
            badge={lightboxBadge}
            onClose={() => setLightboxBadge(null)}
            isMobile={isMobile}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .hex-animate {
            animation: hexPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          }
          @keyframes hexPop {
            from { opacity: 0; transform: scale(0); }
            to { opacity: 1; transform: scale(1); }
          }
        }
      ` }} />
    </div>
  );
}
