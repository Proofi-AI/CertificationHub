"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Certificate, User } from "@prisma/client";
import type { UserFeatures } from "@/lib/features";
import { scoreCertificate } from "@/lib/certStrength";
import CertificateCard from "./CertificateCard";
import CertificateFormModal from "./CertificateFormModal";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";
import InsightsCard from "@/components/InsightsCard";
import RecommendationsCard from "@/components/RecommendationsCard";
import SortControl, { type SortStrategy } from "@/components/SortControl";

interface Props {
  initialCertificates: Certificate[];
  features: UserFeatures;
  profile: Pick<User, "avatarUrl" | "bio" | "slug" | "sortStrategy">;
  onCertificatesChange?: (certs: Certificate[]) => void;
  externalEdit?: Certificate | null;
  onExternalEditDone?: () => void;
}

/* ── Sort helpers ──────────────────────────────────────────────────────── */

function sortCerts(certs: Certificate[], strategy: SortStrategy): Certificate[] {
  const arr = [...certs];
  switch (strategy) {
    case "recent":
      return arr.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    case "strongest":
      return arr.sort((a, b) => scoreCertificate(b).score - scoreCertificate(a).score);
    case "domain":
      return arr.sort((a, b) => {
        const dc = a.domain.localeCompare(b.domain);
        if (dc !== 0) return dc;
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      });
    case "expiring":
      return arr.sort((a, b) => {
        if (!a.expiresAt && !b.expiresAt) return 0;
        if (!a.expiresAt) return 1;
        if (!b.expiresAt) return -1;
        return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
      });
    case "alphabetical":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "custom":
      return arr.sort((a, b) => {
        const ao = a.sortOrder ?? 9999;
        const bo = b.sortOrder ?? 9999;
        return ao - bo;
      });
    default:
      return arr;
  }
}

/* ── Main component ────────────────────────────────────────────────────── */

export default function CertificatesPanel({
  initialCertificates,
  features,
  profile,
  onCertificatesChange,
  externalEdit,
  onExternalEditDone,
}: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Certificate | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [sortStrategy, setSortStrategy] = useState<SortStrategy>(
    (profile.sortStrategy as SortStrategy) ?? "recent"
  );
  const [sortDirty, setSortDirty] = useState(false);
  const [sortSaving, setSortSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Open edit modal when parent requests editing a specific cert
  useEffect(() => {
    if (externalEdit) {
      setEditTarget(externalEdit);
      setModalOpen(true);
    }
  }, [externalEdit]);

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cert: Certificate) => { setEditTarget(cert); setModalOpen(true); };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    onExternalEditDone?.();
  };

  const update = (fn: (prev: Certificate[]) => Certificate[]) => {
    setCertificates((prev) => {
      const next = fn(prev);
      onCertificatesChange?.(next);
      return next;
    });
  };

  const handleSave = (cert: Certificate) => {
    update((prev) => {
      const idx = prev.findIndex((c) => c.id === cert.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = cert; return next; }
      return [cert, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    update((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/certificates/${id}`, { method: "DELETE" });
  };

  const handleVisibilityToggle = async (id: string, isPublic: boolean) => {
    update((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic } : c)));
    const res = await fetch(`/api/certificates/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) update((prev) => prev.map((c) => (c.id === id ? { ...c, isPublic: !isPublic } : c)));
  };

  /* ── Sort ─────────────────────────────────────────────────────────────── */

  const handleSortChange = (s: SortStrategy) => {
    setSortStrategy(s);
    setSortDirty(true);
  };

  const handleSortSave = async () => {
    setSortSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortStrategy }),
      });
      setSortDirty(false);
    } finally {
      setSortSaving(false);
    }
  };

  /* ── Drag & drop (custom order) ──────────────────────────────────────── */

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id !== dragOverId) setDragOverId(id);
    if (dragCancelTimer.current) clearTimeout(dragCancelTimer.current);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    update((prev) => {
      const sorted = sortCerts(prev, "custom");
      const fromIdx = sorted.findIndex((c) => c.id === draggedId);
      const toIdx   = sorted.findIndex((c) => c.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;

      const reordered = [...sorted];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);

      // Assign new sortOrder values
      return prev.map((c) => {
        const idx = reordered.findIndex((r) => r.id === c.id);
        return { ...c, sortOrder: idx };
      });
    });

    setDraggedId(null);
    setDragOverId(null);
    setSortDirty(true);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleSortSaveWithOrder = async () => {
    setSortSaving(true);
    try {
      const sorted = sortCerts(certificates, "custom");
      const orderPayload = sorted.map((c, i) => ({ id: c.id, sortOrder: i }));

      await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortStrategy: "custom" }),
        }),
        fetch("/api/certificates/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        }),
      ]);

      setSortDirty(false);
    } finally {
      setSortSaving(false);
    }
  };

  /* ── Derived state ────────────────────────────────────────────────────── */

  const totalCount = certificates.length;
  const publicCount = certificates.filter((c) => c.isPublic).length;
  const privateCount = totalCount - publicCount;
  const domainCount = useMemo(() => new Set(certificates.map((c) => c.domain)).size, [certificates]);
  const allDomains = useMemo(() => ["All", ...Array.from(new Set(certificates.map((c) => c.domain)))], [certificates]);

  const sortedAndFiltered = useMemo(() => {
    const sorted = sortCerts(certificates, sortStrategy);
    return sorted.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
      const matchDomain = domainFilter === "All" || c.domain === domainFilter;
      return matchSearch && matchDomain;
    });
  }, [certificates, search, domainFilter, sortStrategy]);

  const stats = [
    {
      label: "Total", value: totalCount,
      iconPath: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z",
      bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.18)", icon: "#7c3aed",
    },
    {
      label: "Public", value: publicCount,
      iconPath: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.18)", icon: "#10b981",
    },
    {
      label: "Private", value: privateCount,
      iconPath: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
      bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.18)", icon: "#f59e0b",
    },
    {
      label: "Domains", value: domainCount,
      iconPath: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z",
      bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.18)", icon: "#0ea5e9",
    },
  ];

  const isFiltered = search.length > 0 || domainFilter !== "All";

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Certificates</h1>
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-500 dark:text-white/55 hidden sm:block">
            Manage and showcase your professional achievements
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-100"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden xs:inline sm:inline">Add</span>
          <span className="hidden sm:inline"> Certificate</span>
        </button>
      </div>

      {/* Profile completeness — above stats */}
      <ProfileCompletenessCard
        certificates={certificates}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        slug={profile.slug}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="relative rounded-2xl p-4 overflow-hidden"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[28px] font-black leading-none tracking-tight text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-[11px] font-bold mt-1.5 uppercase tracking-widest text-slate-500 dark:text-white/60">{s.label}</p>
              </div>
              <svg className="w-5 h-5 mt-0.5 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: s.icon }}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Insights panel — below stats, above grid */}
      <InsightsCard certificates={certificates} />

      {/* Recommendations — below insights, above grid */}
      <RecommendationsCard certificates={certificates} />

      {/* Search + filter + sort control */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or issuer…"
              className="w-full rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm outline-none transition-all
                bg-black/[0.04] border border-black/[0.08] focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 text-slate-800 placeholder-slate-400
                dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white dark:placeholder-white/35"
            />
          </div>
          <div className="flex items-center gap-2">
            {allDomains.length > 2 && (
              <select
                value={domainFilter}
                onChange={(e) => setDomainFilter(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl px-3 py-3 sm:py-2.5 text-sm outline-none transition-all cursor-pointer
                  bg-white border border-black/[0.08] focus:border-violet-500/40 text-slate-700
                  dark:bg-[#111425] dark:border-white/[0.11] dark:text-white/75"
              >
                {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <SortControl
              value={sortStrategy}
              onChange={handleSortChange}
              isDirty={sortDirty}
              onSave={sortStrategy === "custom" ? handleSortSaveWithOrder : handleSortSave}
              saving={sortSaving}
            />
          </div>
        </div>
      )}

      {/* Custom order hint */}
      {sortStrategy === "custom" && totalCount > 0 && isFiltered && (
        <div className="text-xs text-slate-400 dark:text-white/40 text-center py-2">
          Clear search and filters to drag reorder certificates.
        </div>
      )}
      {sortStrategy === "custom" && totalCount > 0 && !isFiltered && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          Hover a card and drag to reorder. Click Save order when done.
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="relative rounded-3xl overflow-hidden p-16 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)" }} />
          </div>
          <div className="relative">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.08))",
                border: "1px solid rgba(124,58,237,0.22)",
                boxShadow: "0 0 48px rgba(124,58,237,0.15)",
              }}
            >
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#a78bfa" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No certificates yet</h3>
            <p className="text-sm mb-8 max-w-xs mx-auto leading-relaxed text-slate-500 dark:text-white/55">
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
      {totalCount > 0 && sortedAndFiltered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400 dark:text-white/50">No certificates match your search.</p>
          <button onClick={() => { setSearch(""); setDomainFilter("All"); }} className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm mt-2 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {sortedAndFiltered.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
          onDragLeave={() => {
            // Debounce dragLeave to avoid flicker
            if (dragCancelTimer.current) clearTimeout(dragCancelTimer.current);
            dragCancelTimer.current = setTimeout(() => setDragOverId(null), 80);
          }}
        >
          {sortedAndFiltered.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onEdit={openEdit}
              onDelete={handleDelete}
              onVisibilityToggle={handleVisibilityToggle}
              isDraggable={sortStrategy === "custom" && !isFiltered}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <CertificateFormModal initialData={editTarget} onSave={handleSave} onClose={closeModal} autoFillEnabled={features.autoFillFromImage} />
      )}
    </div>
  );
}
