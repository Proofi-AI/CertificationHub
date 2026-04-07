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
  initialBadgeGroupOrder?: string;
  externalEdit?: Badge | null;
  onExternalEditDone?: () => void;
}

type SortOption = "recent" | "oldest" | "alphabetical" | "organization" | "custom" | "custom_org";

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
    case "custom_org":
      return arr.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    default:
      return arr;
  }
}

const SORT_OPTIONS: { value: SortOption; label: string; desc: string }[] = [
  { value: "recent",       label: "Most recent",    desc: "Newest badges first" },
  { value: "oldest",       label: "Oldest first",   desc: "Earliest badges first" },
  { value: "alphabetical", label: "Alphabetical",   desc: "A – Z by badge title" },
  { value: "organization", label: "Organization",   desc: "Grouped by issuing organization" },
  { value: "custom",       label: "Custom order",   desc: "Drag to reorder manually" },
  { value: "custom_org",   label: "By Organization", desc: "Group by org, drag to reorder" },
];

export default function BadgesPanel({ initialBadges, onBadgesChange, initialSortStrategy, initialBadgeGroupOrder, externalEdit, onExternalEditDone }: Props) {
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
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [orgSheetOpen, setOrgSheetOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgesRef = useRef<Badge[]>(initialBadges);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchInput, setSearchInput] = useState("");

  // custom_org state
  const [orgGroupOrder, setOrgGroupOrder] = useState<string[]>(() => {
    try { return JSON.parse(initialBadgeGroupOrder ?? "[]"); } catch { return []; }
  });
  const [draggedOrg, setDraggedOrg] = useState<string | null>(null);
  const [dragOverOrg, setDragOverOrg] = useState<string | null>(null);
  const [draggedBadgeInOrg, setDraggedBadgeInOrg] = useState<string | null>(null);
  const [dragOverBadgeInOrg, setDragOverBadgeInOrg] = useState<string | null>(null);

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

  const handleSortSaveWithOrder = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      const sorted = sortBadges(badgesRef.current, "custom");
      const orderPayload = sorted.map((b, i) => ({ id: b.id, sortOrder: i }));
      const [r1, r2] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeSortStrategy: "custom" }),
        }),
        fetch("/api/badges/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed to save");
      setSortDirty(false);
    } catch (e) {
      setSortError(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSortSaving(false);
    }
  };

  const handleSortSaveWithOrgOrder = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      // Compute sortOrder per badge: position within its org group
      const orderPayload: { id: string; sortOrder: number }[] = [];
      for (const org of allOrgsForGroups) {
        const orgBadges = badgesByOrg[org];
        orgBadges.forEach((b, i) => orderPayload.push({ id: b.id, sortOrder: i }));
      }
      const [r1, r2] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeSortStrategy: "custom_org", badgeGroupOrder: allOrgsForGroups }),
        }),
        fetch("/api/badges/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed to save");
      setSortDirty(false);
    } catch (e) {
      setSortError(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSortSaving(false);
    }
  };

  /* ── Drag & drop (custom flat order) ─────────────────────────────────── */

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

  /* ── Drag & drop (custom_org) ─────────────────────────────────────────── */

  const handleOrgDragStart = (e: React.DragEvent, org: string) => {
    setDraggedOrg(org);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleOrgDragOver = (e: React.DragEvent, org: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (org !== dragOverOrg) setDragOverOrg(org);
  };
  const handleOrgDrop = (e: React.DragEvent, targetOrg: string) => {
    e.preventDefault();
    if (!draggedOrg || draggedOrg === targetOrg) { setDraggedOrg(null); setDragOverOrg(null); return; }
    setOrgGroupOrder(() => {
      const current = allOrgsForGroups;
      const fromIdx = current.indexOf(draggedOrg);
      const toIdx = current.indexOf(targetOrg);
      const reordered = [...current];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);
      return reordered;
    });
    setSortDirty(true);
    setDraggedOrg(null);
    setDragOverOrg(null);
  };

  const handleBadgeInOrgDragStart = (e: React.DragEvent, badgeId: string) => {
    setDraggedBadgeInOrg(badgeId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleBadgeInOrgDragOver = (e: React.DragEvent, badgeId: string) => {
    e.preventDefault();
    if (badgeId !== dragOverBadgeInOrg) setDragOverBadgeInOrg(badgeId);
  };
  const handleBadgeInOrgDrop = (e: React.DragEvent, targetId: string, org: string) => {
    e.preventDefault();
    if (!draggedBadgeInOrg || draggedBadgeInOrg === targetId) {
      setDraggedBadgeInOrg(null); setDragOverBadgeInOrg(null); return;
    }
    const orgBadges = badgesByOrg[org];
    const fromIdx = orgBadges.findIndex(b => b.id === draggedBadgeInOrg);
    const toIdx = orgBadges.findIndex(b => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedBadgeInOrg(null); setDragOverBadgeInOrg(null); return; }
    const reordered = [...orgBadges];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    // Update sortOrder for badges in this org
    update(prev => prev.map(b => {
      const idx = reordered.findIndex(r => r.id === b.id);
      if (idx === -1) return b;
      return { ...b, sortOrder: idx };
    }));
    setSortDirty(true);
    setDraggedBadgeInOrg(null);
    setDragOverBadgeInOrg(null);
  };

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

  // All unique orgs for the custom_org grouped view
  const allOrgsForGroups = useMemo(() => {
    const orgs = Array.from(new Set(badges.map(b => b.issuingOrganization)));
    const ordered = orgGroupOrder.filter(o => orgs.includes(o));
    const unordered = orgs.filter(o => !orgGroupOrder.includes(o));
    return [...ordered, ...unordered];
  }, [badges, orgGroupOrder]);

  // Badges grouped by org (using sortOrder within each org)
  const badgesByOrg = useMemo(() => {
    const groups: Record<string, Badge[]> = {};
    for (const org of allOrgsForGroups) {
      groups[org] = badges
        .filter(b => b.issuingOrganization === org)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    }
    return groups;
  }, [badges, allOrgsForGroups]);

  const sortedAndFiltered = useMemo(() => {
    let arr: Badge[];
    if (sort === "custom_org") {
      arr = [...badges].sort((a, b) => {
        const aOrgIdx = allOrgsForGroups.indexOf(a.issuingOrganization);
        const bOrgIdx = allOrgsForGroups.indexOf(b.issuingOrganization);
        const aIdx = aOrgIdx === -1 ? 9999 : aOrgIdx;
        const bIdx = bOrgIdx === -1 ? 9999 : bOrgIdx;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      });
    } else {
      arr = sortBadges(badges, sort);
    }
    return arr.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = !q || b.title.toLowerCase().includes(q) || b.issuingOrganization.toLowerCase().includes(q);
      const matchOrg = orgFilter === "All" || b.issuingOrganization === orgFilter;
      return matchSearch && matchOrg;
    });
  }, [badges, search, orgFilter, sort, allOrgsForGroups]);

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

          {/* Desktop: dropdowns */}
          <div className="hidden sm:flex items-center gap-2">
            {allOrgs.length > 2 && (
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="rounded-xl px-3 py-2.5 text-sm outline-none transition-all cursor-pointer appearance-none
                  bg-black/[0.04] border border-black/[0.08] focus:border-violet-500/40 text-slate-700
                  dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white/75"
              >
                {allOrgs.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            <span className="text-xs font-semibold text-slate-400 dark:text-white/40">Sort</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="rounded-xl pl-3 pr-8 py-2 text-xs font-semibold outline-none cursor-pointer appearance-none
                  bg-black/[0.04] border border-black/[0.08] text-slate-700 hover:bg-black/[0.07] transition-all
                  dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white/75 dark:hover:bg-white/[0.09]"
              >
                {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <svg className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
            {sortDirty && (
              <button
                onClick={sort === "custom" ? handleSortSaveWithOrder : sort === "custom_org" ? handleSortSaveWithOrgOrder : handleSortSave}
                disabled={sortSaving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 2px 10px rgba(124,58,237,0.3)" }}
              >
                {sortSaving
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                }
                Save order
              </button>
            )}
          </div>

          {/* Mobile: sheet trigger buttons */}
          <div className="sm:hidden flex items-center gap-2">
            {allOrgs.length > 2 && (
              <button
                onClick={() => setOrgSheetOpen(true)}
                className="flex items-center gap-1.5 min-w-0 flex-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
                  text-slate-600 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                <span className="truncate">{orgFilter === "All" ? "All orgs" : orgFilter}</span>
              </button>
            )}
            <button
              onClick={() => setSortSheetOpen(true)}
              className="flex items-center gap-1.5 min-w-0 flex-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
                text-slate-600 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              <span className="truncate">{SORT_OPTIONS.find((s) => s.value === sort)?.label}</span>
            </button>
            {sortDirty && (
              <button
                onClick={sort === "custom" ? handleSortSaveWithOrder : sort === "custom_org" ? handleSortSaveWithOrgOrder : handleSortSave}
                disabled={sortSaving}
                className="shrink-0 flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                {sortSaving
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : "Save"
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile: Sort bottom sheet */}
      {sortSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSortSheetOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Sort badges</p>
              <button onClick={() => setSortSheetOpen(false)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { handleSortChange(s.value); setSortSheetOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  <div>
                    <p className={`text-sm font-semibold ${sort === s.value ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-white"}`}>
                      {s.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">{s.desc}</p>
                  </div>
                  {sort === s.value && (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => setSortSheetOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Org filter bottom sheet */}
      {orgSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOrgSheetOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Filter by organization</p>
              <button onClick={() => setOrgSheetOpen(false)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {allOrgs.map((o) => (
                <button
                  key={o}
                  onClick={() => { setOrgFilter(o); setOrgSheetOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  <p className={`text-sm font-semibold ${orgFilter === o ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-white"}`}>
                    {o}
                  </p>
                  {orgFilter === o && (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => setOrgSheetOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
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

      {/* Custom org grouped view */}
      {sort === "custom_org" && !isFiltered && totalCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
            Drag org groups to reorder. Drag badges within a group to reorder. Click Save when done.
          </div>
          {allOrgsForGroups.map(org => (
            <div
              key={org}
              draggable
              onDragStart={(e) => handleOrgDragStart(e, org)}
              onDragOver={(e) => handleOrgDragOver(e, org)}
              onDrop={(e) => handleOrgDrop(e, org)}
              onDragEnd={() => { setDraggedOrg(null); setDragOverOrg(null); }}
              className="rounded-2xl p-4 transition-all"
              style={{
                background: "var(--surface)",
                border: dragOverOrg === org ? "2px dashed #7c3aed" : "1px solid var(--border)",
                boxShadow: dragOverOrg === org ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                opacity: draggedOrg === org ? 0.6 : 1,
                cursor: "grab",
              }}
            >
              {/* Org header */}
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-slate-400 dark:text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{org}</span>
                <span className="text-xs text-slate-400 dark:text-white/40 ml-auto">{badgesByOrg[org]?.length} badge{badgesByOrg[org]?.length !== 1 ? "s" : ""}</span>
              </div>
              {/* Badges mini-grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
                {(badgesByOrg[org] ?? []).map(badge => {
                  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
                  const orgInitials = (badge.issuingOrganization || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={badge.id}
                      draggable={!draggedOrg}
                      onDragStart={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDragStart(e, badge.id); }}
                      onDragOver={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDragOver(e, badge.id); }}
                      onDrop={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDrop(e, badge.id, org); }}
                      onDragEnd={() => { if (draggedOrg) return; setDraggedBadgeInOrg(null); setDragOverBadgeInOrg(null); }}
                      className="aspect-square rounded-xl overflow-hidden flex items-center justify-center transition-all"
                      style={{
                        background: "var(--surface-alt)",
                        border: !draggedOrg && dragOverBadgeInOrg === badge.id ? "2px dashed #7c3aed" : "1px solid var(--border)",
                        opacity: draggedBadgeInOrg === badge.id ? 0.5 : 1,
                        cursor: draggedOrg ? "grabbing" : "grab",
                        pointerEvents: draggedOrg ? "none" : "auto",
                      }}
                      title={badge.title}
                    >
                      {badge.imageUrl && !isPdf ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain p-1.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {orgInitials}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Regular grid — hidden when custom_org is active and unfiltered */}
      {(sort !== "custom_org" || isFiltered) && sortedAndFiltered.length > 0 && (
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
