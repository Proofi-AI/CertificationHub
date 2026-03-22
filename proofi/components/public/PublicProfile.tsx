"use client";

import { useState } from "react";
import type { Certificate, User } from "@prisma/client";
import { DOMAIN_COLORS, DOMAIN_GRAD } from "@/lib/constants";
import Link from "next/link";

type PublicUser = Omit<User, "email"> & { certificates: Certificate[] };

interface Props {
  profile: PublicUser;
}

function formatDate(date: Date | string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function PublicCertCard({ cert }: { cert: Certificate }) {
  const colors = DOMAIN_COLORS[cert.domain] ?? DOMAIN_COLORS["Other"];
  const grad = DOMAIN_GRAD[cert.domain] ?? DOMAIN_GRAD["Other"];

  return (
    <div className={`rounded-2xl border border-white/8 bg-gradient-to-br ${grad} overflow-hidden hover:border-white/15 transition-all`}>
      {cert.imageUrl && (
        <div className="h-36 overflow-hidden border-b border-white/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cert.imageUrl} alt={cert.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-2.5">
        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border} font-medium`}>
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
      </div>
    </div>
  );
}

export default function PublicProfile({ profile }: Props) {
  const publicCerts = profile.certificates.filter((c) => c.isPublic);
  const domains = ["All", ...Array.from(new Set(publicCerts.map((c) => c.domain)))];
  const [activeTab, setActiveTab] = useState("All");

  const filtered = activeTab === "All" ? publicCerts : publicCerts.filter((c) => c.domain === activeTab);

  const initials = (profile.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const updatedAt = new Date(profile.updatedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
            {profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatarUrl} alt={profile.name ?? ""} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
            {profile.bio && (
              <p className="text-white/50 text-sm leading-relaxed mb-2 max-w-lg">{profile.bio}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cert) => (
              <PublicCertCard key={cert.id} cert={cert} />
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
    </div>
  );
}
