"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Badge } from "@prisma/client";
import BadgeCard from "@/components/BadgeCard";
import BadgeForm from "@/components/BadgeForm";

interface CustomOrg {
  id: string;
  name: string;
}

interface Props {
  initialBadges: Badge[];
  onBadgesChange?: (badges: Badge[]) => void;
  initialSortStrategy?: SortOption;
  externalEdit?: Badge | null;
  onExternalEditDone?: () => void;
}

type SortOption = "recent" | "oldest" | "alphabetical" | "organization" | "custom";

function sortBadges(badges: Badge[], sort: SortOption): Badge[] {
  const arr = [...badges];
  switch (sort) {
    case "recent":
      return arr.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    case "oldest":
      return arr.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
    case "alphabetical":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "organization":
      return arr.sort((a, b) => a.issuingOrganization.localeCompare(b.issuingOrganization));
    case "custom":
      return arr.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    default:
      return arr;
  }
}

export default function BadgesPanel({ initialBadges, onBadgesChange, initialSortStrategy, externalEdit, onExternalEditDone }: Props) {
  const [badges, setBadges] = useState<Badge[]>(initialBadges);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Badge | null>(null);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("All");
  const [sort, setSort] = useState<SortOption>(initialSortStrategy ?? "recent");
  const [sortDirty, setSortDirty] = useState(false);
  const [sortSaving, setSortSaving] = useState(false);
  const [sortError, setSortError] = useState<string | null>(null);
  const [customOrgs, setCustomOrgs] = useState<CustomOrg[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgesRef = useRef<Badge[]>(initialBadges);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 300);
  };

  useEffect(() => {
    fetch("/api/organizations")
      .then((r) => r.json())
      .then((j) => { if (j.data) setCustomOrgs(j.data); })
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (externalEdit) {
      setEditTarget(externalEdit);
      setModalOpen(true);
      onExternalEditDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalEdit]);

  const update = (fn: (prev: Badge[]) => Badge[]) => {
    const next = fn(badgesRef.current);
    badgesRef.current = next;
    setBadges(next);
    onBadgesChange?.(next);
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (badge: Badge) => { setEditTarget(badge); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTarget(null); };

  const handleSave = (badge: Badge) => {
    update((prev) => {
      const idx = prev.findIndex((b) => b.id === badge.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = badge; return next; }
      return [badge, ...prev];
    });
  };

  const handleDelete = async (id: string) => {
    update((prev) => prev.filter((b) => b.id !== id));
    await fetch(`/api/badges/${id}`, { method: "DELETE" });
  };

  const handleVisibilityToggle = async (id: string, isPublic: boolean) => {
    update((prev) => prev.map((b) => (b.id === id ? { ...b, isPublic } : b)));
    const res = await fetch(`/api/badges/${id}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic }),
    });
    if (!res.ok) update((prev) => prev.map((b) => (b.id === id ? { ...b, isPublic: !isPublic } : b)));
  };

  const handleFeatureToggle = async (id: string, isFeatured: boolean) => {
    update((prev) => prev.map((b) => (b.id === id ? { ...b, isFeatured } : b)));
    await fetch(`/api/badges/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured }),
    });
  };

  /* ── Sort ──────────────────────────────────────────────────────────────── */

  const handleSortChange = (s: SortOption) => {
    setSort(s);
    setSortDirty(true);
    setSortError(null);
  };

  const handleSortSave = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      if (sort === "custom") {
        // Save the current visual order as sortOrder values
        const sorted = sortBadges(badgesRef.current, "custom");
        const orderPayload = sorted.map((b, i) => ({ id: b.id, sortOrder: i }));
        const res = await fetch("/api/badges/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
      // Persist the sort strategy to the user profile
      const profileRes = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeSortStrategy: sort }),
      });
      if (!profileRes.ok) throw new Error(`Profile update failed: HTTP ${profileRes.status}`);
      setSortDirty(false);
    } catch (e) {
      setSortError(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSortSaving(false);
    }
  };

  /* ── Drag & drop ─────────────────────────────────────────────────────── */

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
    if (!draggedId || draggedId === targetId) { setDraggedId(null); setDragOverId(null); return; }

    update((prev) => {
      const sorted = sortBadges(prev, "custom");
      const fromIdx = sorted.findIndex((b) => b.id === draggedId);
      const toIdx = sorted.findIndex((b) => b.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const reordered = [...sorted];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);
      return prev.map((b) => ({ ...b, sortOrder: reordered.findIndex((r) => r.id === b.id) }));
    });

    setDraggedId(null);
    setDragOverId(null);
    setSortDirty(true);
  };

  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };

  /* ── Derived state ─────────────────────────────────────────────────────── */

  const totalCount = badges.length;
  const publicCount = useMemo(() => badges.filter((b) => b.isPublic).length, [badges]);
  const privateCount = totalCount - publicCount;
  const orgCount = useMemo(() => new Set(badges.map((b) => b.issuingOrganization).filter(Boolean)).size, [badges]);
  const featuredCount = useMemo(() => badges.filter((b) => b.isFeatured).length, [badges]);

  const allOrgs = useMemo(() => [
    "All",
    ...Array.from(new Set(badges.map((b) => b.issuingOrganization).filter(Boolean))).sort(),
  ], [badges]);

  const isFiltered = search.length > 0 || orgFilter !== "All";

  const sortedAndFiltered = useMemo(() => {
    const sorted = sortBadges(badges, sort);
    return sorted.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.title.toLowerCase().includes(q) || b.issuingOrganization.toLowerCase().includes(q);
      const matchOrg = orgFilter === "All" || b.issuingOrganization === orgFilter;
      return matchSearch && matchOrg;
    });
  }, [badges, search, orgFilter, sort]);

  const stats = [
    { label: "Total", value: totalCount, iconPath: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", bg: "rgba(124,58,237,0.1)", border: "rgba(124,58,237,0.18)", icon: "#7c3aed" },
    { label: "Public", value: publicCount, iconPath: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.18)", icon: "#10b981" },
    { label: "Private", value: privateCount, iconPath: "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.18)", icon: "#f59e0b" },
    { label: "Organizations", value: orgCount, iconPath: "M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z", bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.18)", icon: "#0ea5e9" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Badges</h1>
          <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 text-slate-500 dark:text-white/55 hidden sm:block">
            Manage and showcase your digital credentials and achievements
          </p>
        </div>
        <button
          onClick={openAdd}
          className="shrink-0 flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-100"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span className="hidden xs:inline sm:inline">Add</span>
          <span className="hidden sm:inline"> Badge</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="relative rounded-2xl p-4 overflow-hidden" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
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

      {/* Search + filter + sort */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-slate-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              value={searchInput}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search by title or organization…"
              className="w-full rounded-xl pl-10 pr-4 py-3 sm:py-2.5 text-sm outline-none transition-all
                bg-black/[0.04] border border-black/[0.08] focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 text-slate-800 placeholder-slate-400
                dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white dark:placeholder-white/35"
            />
          </div>
          <div className="flex items-center gap-2">
            {allOrgs.length > 2 && (
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="flex-1 sm:flex-none rounded-xl px-3 py-3 sm:py-2.5 text-sm outline-none transition-all cursor-pointer
                  bg-white border border-black/[0.08] focus:border-violet-500/40 text-slate-700
                  dark:bg-[#111425] dark:border-white/[0.11] dark:text-white/75"
              >
                {allOrgs.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {/* Sort control */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-slate-400 dark:text-white/40 hidden sm:inline">Sort</span>
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="rounded-xl px-3 py-3 sm:py-2.5 text-sm outline-none transition-all cursor-pointer
                  bg-white border border-black/[0.08] focus:border-violet-500/40 text-slate-700
                  dark:bg-[#111425] dark:border-white/[0.11] dark:text-white/75"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="organization">Organization</option>
                <option value="custom">Custom order</option>
              </select>
              {sortDirty && (
                <button
                  onClick={handleSortSave}
                  disabled={sortSaving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}
                >
                  {sortSaving
                    ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  }
                  Save
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {sortError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20">
          {sortError}
        </div>
      )}

      {sort === "custom" && totalCount > 0 && !isFiltered && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          Hover a card and drag to reorder. Click Save order when done.
        </div>
      )}
      {sort === "custom" && totalCount > 0 && isFiltered && (
        <div className="text-xs text-slate-400 dark:text-white/40 text-center py-2">
          Clear search and filters to drag reorder badges.
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-16 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: "radial-gradient(circle, rgba(124,58,237,0.07), transparent 70%)" }} />
          </div>
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(79,70,229,0.08))", border: "1px solid rgba(124,58,237,0.22)", boxShadow: "0 0 48px rgba(124,58,237,0.15)" }}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: "#a78bfa" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">No badges yet</h3>
            <p className="text-sm mb-8 max-w-xs mx-auto leading-relaxed text-slate-500 dark:text-white/55">
              Add your digital badges and credentials. Import from Credly or add manually.
            </p>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.04] active:scale-100"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 4px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add your first badge
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {totalCount > 0 && sortedAndFiltered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400 dark:text-white/50">No badges match your search.</p>
          <button onClick={() => { setSearchInput(""); setSearch(""); setOrgFilter("All"); }} className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 text-sm mt-2 transition-colors">
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {sortedAndFiltered.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          onDragLeave={() => {
            if (dragCancelTimer.current) clearTimeout(dragCancelTimer.current);
            dragCancelTimer.current = setTimeout(() => setDragOverId(null), 80);
          }}
        >
          {sortedAndFiltered.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onEdit={openEdit}
              onDelete={handleDelete}
              onVisibilityToggle={handleVisibilityToggle}
              onFeatureToggle={handleFeatureToggle}
              featuredCount={featuredCount}
              isDraggable={sort === "custom" && !isFiltered}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              dragOverId={dragOverId}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <BadgeForm
          initialData={editTarget}
          onSave={handleSave}
          onClose={closeModal}
          initialCustomOrgs={customOrgs}
        />
      )}
    </div>
  );
}
