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
import { buildOrgColorMap } from "@/lib/orgColors";

/* ─── Filter Dropdown ──────────────────────────────────────────── */
function FilterDropdown({
  label,
  value,
  options,
  onChange,
  renderOption,
  renderSelected,
  accentActive,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (opt: string) => React.ReactNode;
  renderSelected?: (v: string) => React.ReactNode;
  accentActive?: { bg: string; text: string; border: string };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isFiltered = value !== "All";

  const activeStyle = accentActive
    ? { background: accentActive.bg, color: accentActive.text, borderColor: accentActive.border }
    : undefined;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap select-none ${
          isFiltered
            ? ""
            : "bg-black/[0.04] text-slate-500 border-black/[0.08] hover:border-black/[0.16] hover:text-slate-700 dark:bg-white/5 dark:text-white/40 dark:border-white/10 dark:hover:border-white/20 dark:hover:text-white/60"
        }`}
        style={isFiltered ? activeStyle : undefined}
      >
        <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{label}</span>
        <span className="opacity-20 text-[10px]">|</span>
        {renderSelected ? renderSelected(value) : <span className="max-w-[110px] truncate">{value}</span>}
        <svg
          className={`w-2.5 h-2.5 opacity-50 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 min-w-[180px] rounded-2xl py-1.5 overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border-hover)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <button
            onClick={() => { onChange("All"); setOpen(false); }}
            className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
              value === "All"
                ? "text-violet-600 dark:text-violet-300 bg-violet-500/[0.08]"
                : "text-slate-500 dark:text-white/50 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
            }`}
          >
            <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: value === "All" ? "#7c3aed" : "var(--border)" }}>
              {value === "All" && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
            </span>
            All {label}s
          </button>
          <div className="h-px mx-3 my-1" style={{ background: "var(--border)" }} />
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${
                value === opt
                  ? "text-violet-600 dark:text-violet-300 bg-violet-500/[0.08]"
                  : "text-slate-600 dark:text-white/60 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              }`}
            >
              <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: value === opt ? "#7c3aed" : "var(--border)" }}>
                {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
              </span>
              {renderOption ? renderOption(opt) : <span className="truncate">{opt}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      className="rounded-2xl flex flex-col"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* Domain accent bar */}
      <div className="h-[3px] w-full shrink-0 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }} />

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
      <div className="p-5 flex-1 flex flex-col gap-3 rounded-b-2xl">
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
  const [activeOrgFilter, setActiveOrgFilter] = useState<string>("All");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When domain changes, reset org filter if the selected org no longer exists in the new domain
  useEffect(() => {
    setActiveOrgFilter(prev => {
      if (prev === "All") return prev;
      const domainCerts = activeTab === "All" ? publicCerts : publicCerts.filter(c => c.domain === activeTab);
      const domainBadges = activeTab === "All" ? publicBadges : publicBadges.filter(b => b.domain === activeTab);
      const stillExists = domainCerts.some(c => c.issuer === prev) || domainBadges.some(b => b.issuingOrganization === prev);
      return stillExists ? prev : "All";
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  const publicCerts = profile.certificates.filter((c) => c.isPublic);
  const publicBadges = profile.badges?.filter((b) => b.isPublic) ?? [];

  // Domains from both certificates and badges
  const certDomains = new Set(publicCerts.map((c) => c.domain));
  const badgeDomains = new Set(publicBadges.map((b) => b.domain).filter(Boolean) as string[]);
  const allDomains = ["All", ...Array.from(new Set([...certDomains, ...badgeDomains]))];

  const filteredCerts = publicCerts.filter((c) =>
    (activeTab === "All" || c.domain === activeTab) &&
    (activeOrgFilter === "All" || c.issuer === activeOrgFilter)
  );
  const filteredBadges = publicBadges.filter((b) =>
    (activeTab === "All" || b.domain === activeTab) &&
    (activeOrgFilter === "All" || b.issuingOrganization === activeOrgFilter)
  );

  // Parse group orders from profile
  const badgeGroupOrder: string[] = (() => {
    try { return JSON.parse((profile as { badgeGroupOrder?: string }).badgeGroupOrder ?? "[]"); } catch { return []; }
  })();
  const certGroupOrder: string[] = (() => {
    try { return JSON.parse((profile as { certGroupOrder?: string }).certGroupOrder ?? "[]"); } catch { return []; }
  })();
  const certIssuerGroupOrder: string[] = (() => {
    try { return JSON.parse((profile as { certIssuerGroupOrder?: string }).certIssuerGroupOrder ?? "[]"); } catch { return []; }
  })();
  const badgeDomainGroupOrder: string[] = (() => {
    try { return JSON.parse((profile as { badgeDomainGroupOrder?: string }).badgeDomainGroupOrder ?? "[]"); } catch { return []; }
  })();

  // All unique orgs from all public certs + badges (for top-level org filter)
  // Issuers visible for the current domain filter — only those with content in the selected domain
  const allPublicOrgs = (() => {
    const domainCerts = activeTab === "All" ? publicCerts : publicCerts.filter(c => c.domain === activeTab);
    const domainBadges = activeTab === "All" ? publicBadges : publicBadges.filter(b => b.domain === activeTab);
    const certIssuers = domainCerts.map(c => c.issuer).filter(Boolean);
    const badgeOrgs = domainBadges.map(b => b.issuingOrganization).filter(Boolean);
    const unique = Array.from(new Set([...certIssuers, ...badgeOrgs]));
    if (badgeGroupOrder.length > 0) {
      const ordered = badgeGroupOrder.filter(o => unique.includes(o));
      const rest = unique.filter(o => !badgeGroupOrder.includes(o));
      return [...ordered, ...rest];
    }
    return unique;
  })();

  // Orgs in preferred order for badge color map
  const orgsInOrder = badgeGroupOrder.length > 0
    ? [
        ...badgeGroupOrder.filter(org => filteredBadges.some(b => !b.isFeatured && b.issuingOrganization === org)),
        ...Array.from(new Set(filteredBadges.filter(b => !b.isFeatured).map(b => b.issuingOrganization)))
          .filter(org => !badgeGroupOrder.includes(org)),
      ]
    : Array.from(new Set(filteredBadges.filter(b => !b.isFeatured).map(b => b.issuingOrganization)));

  // Unique color per org — index-based so no two orgs share the same color
  const orgColorMap = buildOrgColorMap(orgsInOrder);

  const nonFeaturedBadges = filteredBadges.filter(b => !b.isFeatured);

  // Sort badges: prefer domain order if badgeDomainGroupOrder, then org order if badgeGroupOrder
  const sortedNonFeaturedBadges = badgeDomainGroupOrder.length > 0
    ? [...nonFeaturedBadges].sort((a, b) => {
        const aIdx = badgeDomainGroupOrder.indexOf(a.domain ?? "");
        const bIdx = badgeDomainGroupOrder.indexOf(b.domain ?? "");
        const aOrd = aIdx === -1 ? 9999 : aIdx;
        const bOrd = bIdx === -1 ? 9999 : bIdx;
        if (aOrd !== bOrd) return aOrd - bOrd;
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      })
    : badgeGroupOrder.length > 0
    ? [...nonFeaturedBadges].sort((a, b) => {
        const aIdx = badgeGroupOrder.indexOf(a.issuingOrganization);
        const bIdx = badgeGroupOrder.indexOf(b.issuingOrganization);
        const aOrd = aIdx === -1 ? 9999 : aIdx;
        const bOrd = bIdx === -1 ? 9999 : bIdx;
        if (aOrd !== bOrd) return aOrd - bOrd;
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      })
    : nonFeaturedBadges;

  const badgesForWall = sortedNonFeaturedBadges;

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

          {/* Filter bar: domain + issuer dropdowns — always one line */}
          {(allDomains.length > 1 || allPublicOrgs.length > 0) && (
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              {allDomains.length > 1 && (
                <FilterDropdown
                  label="Domain"
                  value={activeTab}
                  options={allDomains.filter((d) => d !== "All")}
                  onChange={setActiveTab}
                  accentActive={{
                    bg: "rgba(124,58,237,0.10)",
                    text: "#7c3aed",
                    border: "rgba(124,58,237,0.35)",
                  }}
                  renderSelected={(v) => {
                    if (v === "All") return <span>All</span>;
                    const accent = DOMAIN_ACCENT[v] ?? DOMAIN_ACCENT["Other"];
                    return (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent.from }} />
                        <span className="max-w-[90px] truncate">{v}</span>
                      </span>
                    );
                  }}
                  renderOption={(opt) => {
                    const accent = DOMAIN_ACCENT[opt] ?? DOMAIN_ACCENT["Other"];
                    return (
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: `linear-gradient(135deg, ${accent.from}, ${accent.to})` }} />
                        <span className="truncate">{opt}</span>
                      </span>
                    );
                  }}
                />
              )}

              {allPublicOrgs.length > 0 && (
                <FilterDropdown
                  label="Issuer"
                  value={activeOrgFilter}
                  options={allPublicOrgs}
                  onChange={setActiveOrgFilter}
                  accentActive={{
                    bg: "rgba(20,184,166,0.10)",
                    text: "#0d9488",
                    border: "rgba(20,184,166,0.35)",
                  }}
                  renderSelected={(v) => {
                    if (v === "All") return <span>All</span>;
                    const c = orgColorMap.get(v);
                    const initials = v.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <span className="flex items-center gap-1.5">
                        {c && (
                          <span className="w-4 h-4 rounded-full text-[7px] font-black text-white flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${c.border}, ${c.border}cc)` }}>
                            {initials}
                          </span>
                        )}
                        <span className="max-w-[90px] truncate">{v}</span>
                      </span>
                    );
                  }}
                  renderOption={(opt) => {
                    const c = orgColorMap.get(opt);
                    const initials = opt.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <span className="flex items-center gap-2">
                        {c ? (
                          <span className="w-4 h-4 rounded-full text-[7px] font-black text-white flex items-center justify-center shrink-0"
                            style={{ background: `linear-gradient(135deg, ${c.border}, ${c.border}cc)` }}>
                            {initials}
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
                        )}
                        <span className="truncate">{opt}</span>
                      </span>
                    );
                  }}
                />
              )}

              {/* Clear active filters */}
              {(activeTab !== "All" || activeOrgFilter !== "All") && (
                <button
                  onClick={() => { setActiveTab("All"); setActiveOrgFilter("All"); }}
                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-all
                    text-slate-400 border-black/[0.06] hover:text-slate-600 hover:border-black/[0.14]
                    dark:text-white/30 dark:border-white/[0.08] dark:hover:text-white/60 dark:hover:border-white/[0.18]"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear
                </button>
              )}
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
                badges={badgesForWall}
                onBadgeClick={setLightboxBadge}
                orgColorMap={orgColorMap}
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

              {/* Certificate grid — non-featured only, sorted by certGroupOrder/certIssuerGroupOrder + sortOrder */}
              {(() => {
                const nonFeatured = filteredCerts.filter((c) => !c.isFeatured);
                const sorted = certIssuerGroupOrder.length > 0
                  ? [...nonFeatured].sort((a, b) => {
                      const aIdx = certIssuerGroupOrder.indexOf(a.issuer);
                      const bIdx = certIssuerGroupOrder.indexOf(b.issuer);
                      const aOrd = aIdx === -1 ? 9999 : aIdx;
                      const bOrd = bIdx === -1 ? 9999 : bIdx;
                      if (aOrd !== bOrd) return aOrd - bOrd;
                      return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
                    })
                  : certGroupOrder.length > 0
                  ? [...nonFeatured].sort((a, b) => {
                      const aIdx = certGroupOrder.indexOf(a.domain);
                      const bIdx = certGroupOrder.indexOf(b.domain);
                      const aOrd = aIdx === -1 ? 9999 : aIdx;
                      const bOrd = bIdx === -1 ? 9999 : bIdx;
                      if (aOrd !== bOrd) return aOrd - bOrd;
                      return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
                    })
                  : nonFeatured;
                if (sorted.length === 0) return null;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                    {sorted.map((cert) => (
                      <PublicCertCard key={cert.id} cert={cert} onImageClick={setLightboxCert} />
                    ))}
                  </div>
                );
              })()}
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
