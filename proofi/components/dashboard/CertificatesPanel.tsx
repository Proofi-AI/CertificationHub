"use client";

import { useState, useMemo } from "react";
import type { Certificate } from "@prisma/client";
import CertificateCard from "./CertificateCard";
import CertificateFormModal from "./CertificateFormModal";

interface Props {
  initialCertificates: Certificate[];
}

export default function CertificatesPanel({ initialCertificates }: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certificate | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cert: Certificate) => { setEditTarget(cert); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = (cert: Certificate) => {
    setCertificates((prev) => {
      const idx = prev.findIndex((c) => c.id === cert.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = cert; return next; }
      return [cert, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
  };

  const handleVisibilityToggle = async (id: string, isPublic: boolean) => {
    setCertificates((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic } : c)));
    const res = await fetch(`/api/certificates/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) setCertificates((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic: !isPublic } : c)));
  };

  const totalCount = certificates.length;
  const publicCount = certificates.filter((c) => c.isPublic).length;
  const privateCount = totalCount - publicCount;
  const domainCount = useMemo(() => new Set(certificates.map((c) => c.domain)).size, [certificates]);
  const allDomains = useMemo(() => ["All", ...Array.from(new Set(certificates.map((c) => c.domain)))], [certificates]);

  const filtered = useMemo(() => certificates.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
    const matchDomain = domainFilter === "All" || c.domain === domainFilter;
    return matchSearch && matchDomain;
  }), [certificates, search, domainFilter]);

  const stats = [
    {
      label: "Total", value: totalCount,
      iconPath: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z",
      gradient: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(99,102,241,0.08))",
      border: "rgba(124,58,237,0.2)", iconColor: "#a78bfa",
    },
    {
      label: "Public", value: publicCount,
      iconPath: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(52,211,153,0.08))",
      border: "rgba(16,185,129,0.2)", iconColor: "#6ee7b7",
    },
    {
      label: "Private", value: privateCount,
      iconPath: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.08))",
      border: "rgba(245,158,11,0.2)", iconColor: "#fcd34d",
    },
    {
      label: "Domains", value: domainCount,
      iconPath: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
      gradient: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(59,130,246,0.08))",
      border: "rgba(14,165,233,0.2)", iconColor: "#7dd3fc",
    },
  ];

  return (
    <div className="space-y-8">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Certificates</h1>
          <p className="text-sm text-white/35 mt-1">Manage and showcase your professional achievements</p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-100"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{ background: s.gradient, border: `1px solid ${s.border}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[28px] font-black text-white leading-none tracking-tight">{s.value}</p>
                <p className="text-[11px] font-semibold text-white/40 mt-1.5 uppercase tracking-widest">{s.label}</p>
              </div>
              <svg className="w-5 h-5 mt-0.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: s.iconColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter row */}
      {totalCount > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or issuer…"
              className="w-full bg-white/[0.04] border border-white/[0.07] focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all"
            />
          </div>
          {allDomains.length > 2 && (
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="bg-[#0d0d18] border border-white/[0.07] focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 rounded-xl px-3 py-2.5 text-sm text-white/60 outline-none transition-all cursor-pointer"
            >
              {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="relative rounded-3xl overflow-hidden p-16 text-center" style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.055)" }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08), transparent 70%)" }} />
          </div>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.1))",
                border: "1px solid rgba(124,58,237,0.25)",
                boxShadow: "0 0 48px rgba(124,58,237,0.2)",
              }}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#a78bfa" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white/90 mb-2">No certificates yet</h3>
            <p className="text-white/35 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              Start building your professional portfolio. Add your first certificate and put your skills on display.
            </p>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] active:scale-100"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add your first certificate
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {totalCount > 0 && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white/25 text-sm">No certificates match your search.</p>
          <button
            onClick={() => { setSearch(""); setDomainFilter("All"); }}
            className="text-violet-400 hover:text-violet-300 text-sm mt-2 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onEdit={openEdit}
              onDelete={handleDelete}
              onVisibilityToggle={handleVisibilityToggle}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <CertificateFormModal
          initialData={editTarget}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
