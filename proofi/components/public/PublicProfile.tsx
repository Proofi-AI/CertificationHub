"use client";

import { useState } from "react";
import type { Certificate, User } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_GRAD } from "@/lib/constants";
import Link from "next/link";
import CertificateLightbox from "@/components/CertificateLightbox";

type PublicUser = Omit<User, "email"> & { certificates: Certificate[] };

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
  const colors = DOMAIN_COLORS[cert.domain] ?? DOMAIN_COLORS["Other"];
  const grad = DOMAIN_GRAD[cert.domain] ?? DOMAIN_GRAD["Other"];
  const isPdf = cert.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <div
      className={`rounded-2xl border border-white/8 bg-gradient-to-br ${grad} overflow-hidden hover:border-white/20 transition-all hover:shadow-lg hover:shadow-black/20 group`}
    >
      {/* Certificate image / PDF — clickable */}
      {cert.imageUrl && (
        <button
          type="button"
          onClick={() => onImageClick(cert)}
          className="w-full block relative overflow-hidden border-b border-white/5"
          title="Click to view full size"
        >
          {isPdf ? (
            <div className="h-44 flex flex-col items-center justify-center gap-3 bg-red-500/8 hover:bg-red-500/12 transition-colors">
              <svg className="w-10 h-10 text-red-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs text-white/40 font-medium">PDF Certificate</span>
              <span className="text-xs text-white/25 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
                Click to view
              </span>
            </div>
          ) : (
            <div className="relative h-48 overflow-hidden bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cert.imageUrl}
                alt={cert.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
              {/* Zoom hint overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </button>
      )}

      {/* Card details */}
      <div className="p-4 space-y-2.5">
        <span
          className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} font-medium`}
        >
          {cert.domain}
        </span>
        <div>
          <p className="font-semibold text-sm leading-tight">{cert.name}</p>
          <p className="text-white/50 text-xs mt-0.5">{cert.issuer}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/35">
          <span>{formatDate(cert.issuedAt)}</span>
          {cert.expiresAt ? (
            <><span>·</span><span>Expires {formatDate(cert.expiresAt)}</span></>
          ) : (
            <><span>·</span><span>No expiry</span></>
          )}
        </div>
        {cert.credentialId && (
          <p className="text-xs text-white/25 font-mono truncate">ID: {cert.credentialId}</p>
        )}

        {/* View full button */}
        {cert.imageUrl && (
          <button
            type="button"
            onClick={() => onImageClick(cert)}
            className="w-full mt-1 flex items-center justify-center gap-1.5 text-xs text-white/35 hover:text-white/60 bg-white/3 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-lg py-1.5 transition-all"
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
  const publicCerts = profile.certificates.filter((c) => c.isPublic);
  const domains = ["All", ...Array.from(new Set(publicCerts.map((c) => c.domain)))];
  const [activeTab, setActiveTab] = useState("All");
  const [lightboxCert, setLightboxCert] = useState<Certificate | null>(null);

  const filtered =
    activeTab === "All" ? publicCerts : publicCerts.filter((c) => c.domain === activeTab);

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
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      {/* Fixed blobs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-violet-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-blue-600/6 rounded-full blur-[120px] pointer-events-none" />

      {/* Minimal nav */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-sm font-semibold text-white/70">Proofi AI</span>
          </Link>
          <Link
            href="/signup"
            className="text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-4 py-1.5 rounded-full transition-all"
          >
            Create your profile
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-lg">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.name ?? ""}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
            {profile.bio && (
              <p className="text-white/50 text-sm leading-relaxed mb-2 max-w-lg">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-white/30">Updated {updatedAt}</span>
              <span className="text-white/20">·</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {publicCerts.length} certificate{publicCerts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Domain filter tabs */}
        {domains.length > 1 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {domains.map((domain) => (
              <button
                key={domain}
                onClick={() => setActiveTab(domain)}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all ${
                  activeTab === domain
                    ? "bg-violet-600/25 text-violet-300 border-violet-500/40"
                    : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {domain}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="glass rounded-2xl border border-white/8 p-12 text-center">
            <p className="text-white/40 text-sm">No public certificates in this category.</p>
          </div>
        )}

        {/* Certificate grid */}
        {filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cert) => (
              <PublicCertCard
                key={cert.id}
                cert={cert}
                onImageClick={setLightboxCert}
              />
            ))}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-16 text-center glass rounded-2xl border border-white/8 p-8">
          <p className="text-white/40 text-sm mb-3">Powered by Proofi AI</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all shadow-lg shadow-violet-500/20"
          >
            Create your own profile — free
          </Link>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxCert?.imageUrl && (
        <CertificateLightbox
          src={lightboxCert.imageUrl}
          alt={`${lightboxCert.name} — ${lightboxCert.issuer}`}
          isPdf={lightboxCert.imageUrl.toLowerCase().endsWith(".pdf")}
          onClose={() => setLightboxCert(null)}
        />
      )}
    </div>
  );
}
