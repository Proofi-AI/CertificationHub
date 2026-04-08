"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Badge } from "@prisma/client";
import BadgeCard from "@/components/BadgeCard";
import BadgeForm from "@/components/BadgeForm";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import InfoModal from "@/components/InfoModal";

interface CustomOrg {
  id: string;
  name: string;
}

interface Props {
  initialBadges: Badge[];
  onBadgesChange?: (badges: Badge[]) => void;
  initialSortStrategy?: SortOption;
  initialBadgeGroupOrder?: string;
  initialBadgeDomainGroupOrder?: string;
  externalEdit?: Badge | null;
  onExternalEditDone?: () => void;
}

type SortOption = "recent" | "oldest" | "alphabetical" | "custom" | "custom_org" | "custom_domain";

function sortBadges(badges: Badge[], sort: SortOption): Badge[] {
  const arr = [...badges];
  switch (sort) {
    case "recent":
      return arr.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
    case "oldest":
      return arr.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
    case "alphabetical":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "custom":
      return arr.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    case "custom_org":
    case "custom_domain":
      return arr.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    default:
      return arr;
  }
}

const SORT_OPTIONS: { value: SortOption; label: string; desc: string }[] = [
  { value: "recent",       label: "Most recent",    desc: "Newest badges first" },
  { value: "oldest",       label: "Oldest first",   desc: "Earliest badges first" },
  { value: "alphabetical", label: "Alphabetical",   desc: "A – Z by badge title" },
  { value: "custom_org",    label: "Custom Organization", desc: "Group by org, drag to reorder" },
  { value: "custom_domain", label: "Custom Domain",      desc: "Group by domain, drag to reorder" },
  { value: "custom",        label: "Custom order",   desc: "Drag to reorder manually" },
];

export default function BadgesPanel({ initialBadges, onBadgesChange, initialSortStrategy, initialBadgeGroupOrder, initialBadgeDomainGroupOrder, externalEdit, onExternalEditDone }: Props) {
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
  // Touch drag state for org groups (mobile)
  const orgTouchRef = useRef<{ org: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const orgTouchOverRef = useRef<string | null>(null);
  const [draggedBadgeInOrg, setDraggedBadgeInOrg] = useState<string | null>(null);
  const [dragOverBadgeInOrg, setDragOverBadgeInOrg] = useState<string | null>(null);
  const badgeInOrgTouchRef = useRef<{ id: string; org: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const badgeInOrgTouchOverRef = useRef<string | null>(null);
  const [selectedOrgBadge, setSelectedOrgBadge] = useState<Badge | null>(null);
  const [orgBadgeDeleteConfirm, setOrgBadgeDeleteConfirm] = useState(false);
  const [orgBadgePinLimit, setOrgBadgePinLimit] = useState(false);

  // custom_domain state
  const [domainGroupOrder, setDomainGroupOrder] = useState<string[]>(() => {
    try { return JSON.parse(initialBadgeDomainGroupOrder ?? "[]"); } catch { return []; }
  });
  const [draggedDomain, setDraggedDomain] = useState<string | null>(null);
  const [dragOverDomain, setDragOverDomain] = useState<string | null>(null);
  const domainTouchRef = useRef<{ domain: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const domainTouchOverRef = useRef<string | null>(null);
  const [draggedBadgeInDomain, setDraggedBadgeInDomain] = useState<string | null>(null);
  const [dragOverBadgeInDomain, setDragOverBadgeInDomain] = useState<string | null>(null);
  const badgeInDomainTouchRef = useRef<{ id: string; domain: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const badgeInDomainTouchOverRef = useRef<string | null>(null);
  const [selectedDomainBadge, setSelectedDomainBadge] = useState<Badge | null>(null);
  const [domainBadgeDeleteConfirm, setDomainBadgeDeleteConfirm] = useState(false);
  const [domainBadgePinLimit, setDomainBadgePinLimit] = useState(false);

  // Prevent page scroll during active touch drag (non-passive listener required)
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (
        orgTouchRef.current?.active ||
        domainTouchRef.current?.active ||
        badgeInOrgTouchRef.current?.active ||
        badgeInDomainTouchRef.current?.active
      ) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, []);

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

  const handleSortSaveWithDomainOrder = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      const orderPayload: { id: string; sortOrder: number }[] = [];
      for (const domain of allDomainsForGroups) {
        const domainBadges = badgesByDomain[domain] ?? [];
        domainBadges.forEach((b, i) => orderPayload.push({ id: b.id, sortOrder: i }));
      }
      const [r1, r2] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeSortStrategy: "custom_domain", badgeDomainGroupOrder: allDomainsForGroups }),
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

  /* ── Touch drag (org groups — mobile) ────────────────────────────────── */

  const handleOrgTouchStart = (e: React.TouchEvent, org: string) => {
    const t = e.touches[0];
    if (orgTouchRef.current?.timer) clearTimeout(orgTouchRef.current.timer);
    const timer = setTimeout(() => {
      if (orgTouchRef.current) {
        orgTouchRef.current.active = true;
        setDraggedOrg(org);
        navigator.vibrate?.(40);
      }
    }, 450);
    orgTouchRef.current = { org, startX: t.clientX, startY: t.clientY, active: false, timer };
  };

  const handleOrgTouchMove = (e: React.TouchEvent) => {
    if (!orgTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - orgTouchRef.current.startX;
    const dy = t.clientY - orgTouchRef.current.startY;
    // If not yet in drag mode and finger moved too far — it's a scroll, cancel
    if (!orgTouchRef.current.active) {
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (orgTouchRef.current.timer) clearTimeout(orgTouchRef.current.timer);
        orgTouchRef.current = null;
      }
      return;
    }
    // Active drag — find target via bounding rect
    let targetOrg: string | null = null;
    document.querySelectorAll<HTMLElement>('[data-org-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        t.clientX >= rect.left && t.clientX <= rect.right &&
        t.clientY >= rect.top  && t.clientY <= rect.bottom
      ) {
        const id = el.getAttribute('data-org-id');
        if (id && id !== orgTouchRef.current!.org) targetOrg = id;
      }
    });
    if (targetOrg !== orgTouchOverRef.current) {
      setDragOverOrg(targetOrg);
      orgTouchOverRef.current = targetOrg;
    }
  };

  const handleOrgTouchEnd = () => {
    if (orgTouchRef.current?.timer) clearTimeout(orgTouchRef.current.timer);
    if (!orgTouchRef.current?.active) {
      orgTouchRef.current = null;
      return;
    }
    const dragged = orgTouchRef.current.org;
    const target = orgTouchOverRef.current;
    if (dragged && target && dragged !== target) {
      setOrgGroupOrder(() => {
        const current = allOrgsForGroups;
        const fromIdx = current.indexOf(dragged);
        const toIdx = current.indexOf(target);
        const reordered = [...current];
        const [removed] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, removed);
        return reordered;
      });
      setSortDirty(true);
    }
    orgTouchRef.current = null;
    orgTouchOverRef.current = null;
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

  /* ── Touch drag (badge items within org groups — mobile) ─────────────── */

  const handleBadgeInOrgTouchStart = (e: React.TouchEvent, badgeId: string, org: string) => {
    if (orgTouchRef.current?.active) return; // group drag takes priority
    const t = e.touches[0];
    if (badgeInOrgTouchRef.current?.timer) clearTimeout(badgeInOrgTouchRef.current.timer);
    const timer = setTimeout(() => {
      if (badgeInOrgTouchRef.current) {
        badgeInOrgTouchRef.current.active = true;
        setDraggedBadgeInOrg(badgeId);
        navigator.vibrate?.(40);
      }
    }, 450);
    badgeInOrgTouchRef.current = { id: badgeId, org, startX: t.clientX, startY: t.clientY, active: false, timer };
  };
  const handleBadgeInOrgTouchMove = (e: React.TouchEvent) => {
    if (!badgeInOrgTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - badgeInOrgTouchRef.current.startX;
    const dy = t.clientY - badgeInOrgTouchRef.current.startY;
    if (!badgeInOrgTouchRef.current.active) {
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (badgeInOrgTouchRef.current.timer) clearTimeout(badgeInOrgTouchRef.current.timer);
        badgeInOrgTouchRef.current = null;
      }
      return;
    }
    let targetId: string | null = null;
    document.querySelectorAll<HTMLElement>('[data-org-badge-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        const id = el.getAttribute('data-org-badge-id');
        if (id && id !== badgeInOrgTouchRef.current!.id) targetId = id;
      }
    });
    if (targetId !== badgeInOrgTouchOverRef.current) {
      setDragOverBadgeInOrg(targetId);
      badgeInOrgTouchOverRef.current = targetId;
    }
  };
  const handleBadgeInOrgTouchEnd = (org: string) => {
    if (badgeInOrgTouchRef.current?.timer) clearTimeout(badgeInOrgTouchRef.current.timer);
    if (!badgeInOrgTouchRef.current?.active) { badgeInOrgTouchRef.current = null; return; }
    const dragged = badgeInOrgTouchRef.current.id;
    const target = badgeInOrgTouchOverRef.current;
    if (dragged && target && dragged !== target) {
      const orgBadges = badgesByOrg[org] ?? [];
      const fromIdx = orgBadges.findIndex(b => b.id === dragged);
      const toIdx = orgBadges.findIndex(b => b.id === target);
      if (fromIdx !== -1 && toIdx !== -1) {
        const reordered = [...orgBadges];
        const [removed] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, removed);
        update(prev => prev.map(b => {
          const idx = reordered.findIndex(r => r.id === b.id);
          if (idx === -1) return b;
          return { ...b, sortOrder: idx };
        }));
        setSortDirty(true);
      }
    }
    badgeInOrgTouchRef.current = null;
    badgeInOrgTouchOverRef.current = null;
    setDraggedBadgeInOrg(null);
    setDragOverBadgeInOrg(null);
  };

  /* ── Touch drag (badge items within domain groups — mobile) ───────────── */

  const handleBadgeInDomainTouchStart = (e: React.TouchEvent, badgeId: string, domain: string) => {
    if (domainTouchRef.current?.active) return; // group drag takes priority
    const t = e.touches[0];
    if (badgeInDomainTouchRef.current?.timer) clearTimeout(badgeInDomainTouchRef.current.timer);
    const timer = setTimeout(() => {
      if (badgeInDomainTouchRef.current) {
        badgeInDomainTouchRef.current.active = true;
        setDraggedBadgeInDomain(badgeId);
        navigator.vibrate?.(40);
      }
    }, 450);
    badgeInDomainTouchRef.current = { id: badgeId, domain, startX: t.clientX, startY: t.clientY, active: false, timer };
  };
  const handleBadgeInDomainTouchMove = (e: React.TouchEvent) => {
    if (!badgeInDomainTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - badgeInDomainTouchRef.current.startX;
    const dy = t.clientY - badgeInDomainTouchRef.current.startY;
    if (!badgeInDomainTouchRef.current.active) {
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (badgeInDomainTouchRef.current.timer) clearTimeout(badgeInDomainTouchRef.current.timer);
        badgeInDomainTouchRef.current = null;
      }
      return;
    }
    let targetId: string | null = null;
    document.querySelectorAll<HTMLElement>('[data-domain-badge-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        const id = el.getAttribute('data-domain-badge-id');
        if (id && id !== badgeInDomainTouchRef.current!.id) targetId = id;
      }
    });
    if (targetId !== badgeInDomainTouchOverRef.current) {
      setDragOverBadgeInDomain(targetId);
      badgeInDomainTouchOverRef.current = targetId;
    }
  };
  const handleBadgeInDomainTouchEnd = (domain: string) => {
    if (badgeInDomainTouchRef.current?.timer) clearTimeout(badgeInDomainTouchRef.current.timer);
    if (!badgeInDomainTouchRef.current?.active) { badgeInDomainTouchRef.current = null; return; }
    const dragged = badgeInDomainTouchRef.current.id;
    const target = badgeInDomainTouchOverRef.current;
    if (dragged && target && dragged !== target) {
      const domainBadges = badgesByDomain[domain] ?? [];
      const fromIdx = domainBadges.findIndex(b => b.id === dragged);
      const toIdx = domainBadges.findIndex(b => b.id === target);
      if (fromIdx !== -1 && toIdx !== -1) {
        const reordered = [...domainBadges];
        const [removed] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, removed);
        update(prev => prev.map(b => {
          const idx = reordered.findIndex(r => r.id === b.id);
          if (idx === -1) return b;
          return { ...b, sortOrder: idx };
        }));
        setSortDirty(true);
      }
    }
    badgeInDomainTouchRef.current = null;
    badgeInDomainTouchOverRef.current = null;
    setDraggedBadgeInDomain(null);
    setDragOverBadgeInDomain(null);
  };

  /* ── Drag & drop (custom_domain) ────────────────────────────────────── */

  const handleDomainDragStart = (e: React.DragEvent, domain: string) => {
    setDraggedDomain(domain);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDomainDragOver = (e: React.DragEvent, domain: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (domain !== dragOverDomain) setDragOverDomain(domain);
  };
  const handleDomainDrop = (e: React.DragEvent, targetDomain: string) => {
    e.preventDefault();
    if (!draggedDomain || draggedDomain === targetDomain) { setDraggedDomain(null); setDragOverDomain(null); return; }
    setDomainGroupOrder(() => {
      const current = allDomainsForGroups;
      const fromIdx = current.indexOf(draggedDomain);
      const toIdx = current.indexOf(targetDomain);
      const reordered = [...current];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);
      return reordered;
    });
    setSortDirty(true);
    setDraggedDomain(null);
    setDragOverDomain(null);
  };

  const handleDomainTouchStart = (e: React.TouchEvent, domain: string) => {
    const t = e.touches[0];
    if (domainTouchRef.current?.timer) clearTimeout(domainTouchRef.current.timer);
    const timer = setTimeout(() => {
      if (domainTouchRef.current) {
        domainTouchRef.current.active = true;
        setDraggedDomain(domain);
        navigator.vibrate?.(40);
      }
    }, 450);
    domainTouchRef.current = { domain, startX: t.clientX, startY: t.clientY, active: false, timer };
  };
  const handleDomainTouchMove = (e: React.TouchEvent) => {
    if (!domainTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - domainTouchRef.current.startX;
    const dy = t.clientY - domainTouchRef.current.startY;
    // If not yet in drag mode and finger moved too far — it's a scroll, cancel
    if (!domainTouchRef.current.active) {
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (domainTouchRef.current.timer) clearTimeout(domainTouchRef.current.timer);
        domainTouchRef.current = null;
      }
      return;
    }
    let targetDomain: string | null = null;
    document.querySelectorAll<HTMLElement>('[data-domain-id]').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        const id = el.getAttribute('data-domain-id');
        if (id && id !== domainTouchRef.current!.domain) targetDomain = id;
      }
    });
    if (targetDomain !== domainTouchOverRef.current) {
      setDragOverDomain(targetDomain);
      domainTouchOverRef.current = targetDomain;
    }
  };
  const handleDomainTouchEnd = () => {
    if (domainTouchRef.current?.timer) clearTimeout(domainTouchRef.current.timer);
    if (!domainTouchRef.current?.active) { domainTouchRef.current = null; return; }
    const dragged = domainTouchRef.current.domain;
    const target = domainTouchOverRef.current;
    if (dragged && target && dragged !== target) {
      setDomainGroupOrder(() => {
        const current = allDomainsForGroups;
        const fromIdx = current.indexOf(dragged);
        const toIdx = current.indexOf(target);
        const reordered = [...current];
        const [removed] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, removed);
        return reordered;
      });
      setSortDirty(true);
    }
    domainTouchRef.current = null;
    domainTouchOverRef.current = null;
    setDraggedDomain(null);
    setDragOverDomain(null);
  };

  const handleBadgeInDomainDragStart = (e: React.DragEvent, badgeId: string) => {
    setDraggedBadgeInDomain(badgeId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleBadgeInDomainDragOver = (e: React.DragEvent, badgeId: string) => {
    e.preventDefault();
    if (badgeId !== dragOverBadgeInDomain) setDragOverBadgeInDomain(badgeId);
  };
  const handleBadgeInDomainDrop = (e: React.DragEvent, targetId: string, domain: string) => {
    e.preventDefault();
    if (!draggedBadgeInDomain || draggedBadgeInDomain === targetId) { setDraggedBadgeInDomain(null); setDragOverBadgeInDomain(null); return; }
    const domainBadges = badgesByDomain[domain] ?? [];
    const fromIdx = domainBadges.findIndex(b => b.id === draggedBadgeInDomain);
    const toIdx = domainBadges.findIndex(b => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedBadgeInDomain(null); setDragOverBadgeInDomain(null); return; }
    const reordered = [...domainBadges];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    update(prev => prev.map(b => {
      const idx = reordered.findIndex(r => r.id === b.id);
      if (idx === -1) return b;
      return { ...b, sortOrder: idx };
    }));
    setSortDirty(true);
    setDraggedBadgeInDomain(null);
    setDragOverBadgeInDomain(null);
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

  const allDomainsForGroups = useMemo(() => {
    const domains = Array.from(new Set(badges.map(b => b.domain).filter(Boolean))) as string[];
    const ordered = domainGroupOrder.filter(d => domains.includes(d));
    const unordered = domains.filter(d => !domainGroupOrder.includes(d));
    return [...ordered, ...unordered];
  }, [badges, domainGroupOrder]);

  const badgesByDomain = useMemo(() => {
    const groups: Record<string, Badge[]> = {};
    for (const domain of allDomainsForGroups) {
      groups[domain] = badges
        .filter(b => b.domain === domain)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    }
    return groups;
  }, [badges, allDomainsForGroups]);

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
    } else if (sort === "custom_domain") {
      arr = [...badges].sort((a, b) => {
        const aDomainIdx = allDomainsForGroups.indexOf(a.domain ?? "");
        const bDomainIdx = allDomainsForGroups.indexOf(b.domain ?? "");
        const aIdx = aDomainIdx === -1 ? 9999 : aDomainIdx;
        const bIdx = bDomainIdx === -1 ? 9999 : bDomainIdx;
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
  }, [badges, search, orgFilter, sort, allOrgsForGroups, allDomainsForGroups]);

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
              placeholder="Search by name or issuing organization…"
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
                onClick={sort === "custom" ? handleSortSaveWithOrder : sort === "custom_org" ? handleSortSaveWithOrgOrder : sort === "custom_domain" ? handleSortSaveWithDomainOrder : handleSortSave}
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
                onClick={sort === "custom" ? handleSortSaveWithOrder : sort === "custom_org" ? handleSortSaveWithOrgOrder : sort === "custom_domain" ? handleSortSaveWithDomainOrder : handleSortSave}
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
              data-org-id={org}
              draggable
              onDragStart={(e) => handleOrgDragStart(e, org)}
              onDragOver={(e) => handleOrgDragOver(e, org)}
              onDrop={(e) => handleOrgDrop(e, org)}
              onDragEnd={() => { setDraggedOrg(null); setDragOverOrg(null); }}
              onTouchStart={(e) => handleOrgTouchStart(e, org)}
              onTouchMove={handleOrgTouchMove}
              onTouchEnd={handleOrgTouchEnd}
              className="rounded-2xl p-4 transition-all"
              style={{
                background: "var(--surface)",
                border: dragOverOrg === org ? "2px dashed #7c3aed" : "1px solid var(--border)",
                boxShadow: dragOverOrg === org ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                opacity: draggedOrg === org ? 0.6 : 1,
                cursor: "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
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
                      data-org-badge-id={badge.id}
                      draggable={!draggedOrg}
                      onDragStart={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDragStart(e, badge.id); }}
                      onDragOver={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDragOver(e, badge.id); }}
                      onDrop={(e) => { if (draggedOrg) return; e.stopPropagation(); handleBadgeInOrgDrop(e, badge.id, org); }}
                      onDragEnd={() => { if (draggedOrg) return; setDraggedBadgeInOrg(null); setDragOverBadgeInOrg(null); }}
                      onTouchStart={(e) => { if (!draggedOrg) { e.stopPropagation(); handleBadgeInOrgTouchStart(e, badge.id, org); } }}
                      onTouchMove={(e) => { if (!draggedOrg) handleBadgeInOrgTouchMove(e); }}
                      onTouchEnd={(e) => { if (!draggedOrg) { e.stopPropagation(); handleBadgeInOrgTouchEnd(org); } }}
                      onClick={() => { if (!draggedBadgeInOrg) setSelectedOrgBadge(badge); }}
                      className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center transition-all"
                      style={{
                        background: "var(--surface-alt)",
                        border: !draggedOrg && dragOverBadgeInOrg === badge.id ? "2px dashed #7c3aed" : "1px solid var(--border)",
                        opacity: draggedBadgeInOrg === badge.id ? 0.5 : 1,
                        cursor: draggedOrg ? "grabbing" : "pointer",
                        pointerEvents: draggedOrg ? "none" : "auto",
                        filter: !badge.isPublic ? "grayscale(1)" : "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                      title={badge.title}
                    >
                      {badge.imageUrl && !isPdf ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={badge.imageUrl}
                          alt={badge.title}
                          className="w-full h-full object-contain p-1.5"
                          style={{ opacity: badge.isPublic ? 1 : 0.5 }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {orgInitials}
                        </div>
                      )}
                      {/* Hidden indicator */}
                      {!badge.isPublic && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white/70 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </div>
                      )}
                      {/* Featured indicator */}
                      {badge.isFeatured && (
                        <div className="absolute top-1 left-1 w-3.5 h-3.5 flex items-center justify-center">
                          <svg className="w-3 h-3 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
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

      {/* Domain grouped view */}
      {sort === "custom_domain" && !isFiltered && totalCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
            Drag domain groups to reorder. Drag badges within a group to reorder. Click Save when done.
          </div>
          {allDomainsForGroups.map(domain => (
            <div
              key={domain}
              data-domain-id={domain}
              draggable
              onDragStart={(e) => handleDomainDragStart(e, domain)}
              onDragOver={(e) => handleDomainDragOver(e, domain)}
              onDrop={(e) => handleDomainDrop(e, domain)}
              onDragEnd={() => { setDraggedDomain(null); setDragOverDomain(null); }}
              onTouchStart={(e) => handleDomainTouchStart(e, domain)}
              onTouchMove={handleDomainTouchMove}
              onTouchEnd={handleDomainTouchEnd}
              className="rounded-2xl p-4 transition-all"
              style={{
                background: "var(--surface)",
                border: dragOverDomain === domain ? "2px dashed #7c3aed" : "1px solid var(--border)",
                boxShadow: dragOverDomain === domain ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                opacity: draggedDomain === domain ? 0.6 : 1,
                cursor: "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {/* Domain header */}
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-slate-400 dark:text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                </svg>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{domain}</span>
                <span className="text-xs text-slate-400 dark:text-white/40 ml-auto">{badgesByDomain[domain]?.length} badge{badgesByDomain[domain]?.length !== 1 ? "s" : ""}</span>
              </div>
              {/* Badges mini-grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2">
                {(badgesByDomain[domain] ?? []).map(badge => {
                  const isPdf = badge.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
                  const domainInitials = (badge.issuingOrganization || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={badge.id}
                      data-domain-badge-id={badge.id}
                      draggable={!draggedDomain}
                      onDragStart={(e) => { if (draggedDomain) return; e.stopPropagation(); handleBadgeInDomainDragStart(e, badge.id); }}
                      onDragOver={(e) => { if (draggedDomain) return; e.stopPropagation(); handleBadgeInDomainDragOver(e, badge.id); }}
                      onDrop={(e) => { if (draggedDomain) return; e.stopPropagation(); handleBadgeInDomainDrop(e, badge.id, domain); }}
                      onDragEnd={() => { if (draggedDomain) return; setDraggedBadgeInDomain(null); setDragOverBadgeInDomain(null); }}
                      onTouchStart={(e) => { if (!draggedDomain) { e.stopPropagation(); handleBadgeInDomainTouchStart(e, badge.id, domain); } }}
                      onTouchMove={(e) => { if (!draggedDomain) handleBadgeInDomainTouchMove(e); }}
                      onTouchEnd={(e) => { if (!draggedDomain) { e.stopPropagation(); handleBadgeInDomainTouchEnd(domain); } }}
                      onClick={() => { if (!draggedBadgeInDomain) setSelectedDomainBadge(badge); }}
                      className="relative aspect-square rounded-xl overflow-hidden flex items-center justify-center transition-all"
                      style={{
                        background: "var(--surface-alt)",
                        border: !draggedDomain && dragOverBadgeInDomain === badge.id ? "2px dashed #7c3aed" : "1px solid var(--border)",
                        opacity: draggedBadgeInDomain === badge.id ? 0.5 : 1,
                        cursor: draggedDomain ? "grabbing" : "pointer",
                        pointerEvents: draggedDomain ? "none" : "auto",
                        filter: !badge.isPublic ? "grayscale(1)" : "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                      title={badge.title}
                    >
                      {badge.imageUrl && !isPdf ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.imageUrl} alt={badge.title} className="w-full h-full object-contain p-1.5" style={{ opacity: badge.isPublic ? 1 : 0.5 }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          {domainInitials}
                        </div>
                      )}
                      {!badge.isPublic && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white/70 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        </div>
                      )}
                      {badge.isFeatured && (
                        <div className="absolute top-1 left-1 w-3.5 h-3.5 flex items-center justify-center">
                          <svg className="w-3 h-3 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
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

      {/* Regular grid — hidden when custom_org or custom_domain is active and unfiltered */}
      {(sort !== "custom_org" && sort !== "custom_domain" || isFiltered) && sortedAndFiltered.length > 0 && (
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

      {/* Org-view badge action sheet */}
      {selectedOrgBadge && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedOrgBadge(null)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Badge info header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                {selectedOrgBadge.imageUrl && !selectedOrgBadge.imageUrl.toLowerCase().endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedOrgBadge.imageUrl} alt={selectedOrgBadge.title} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    {selectedOrgBadge.issuingOrganization.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedOrgBadge.title}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 truncate">{selectedOrgBadge.issuingOrganization}</p>
              </div>
              <button onClick={() => setSelectedOrgBadge(null)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex flex-col gap-3">
              {/* Visibility toggle */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Public visibility</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{selectedOrgBadge.isPublic ? "Visible on your public profile" : "Hidden from your public profile"}</p>
                </div>
                <button
                  onClick={() => {
                    handleVisibilityToggle(selectedOrgBadge.id, !selectedOrgBadge.isPublic);
                    setSelectedOrgBadge({ ...selectedOrgBadge, isPublic: !selectedOrgBadge.isPublic });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${selectedOrgBadge.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${selectedOrgBadge.isPublic ? "translate-x-[20px]" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Edit */}
              <button
                onClick={() => {
                  setSelectedOrgBadge(null);
                  openEdit(selectedOrgBadge);
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Edit badge</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Update title, image, dates and more</p>
                </div>
              </button>

              {/* Pin / unpin */}
              <button
                onClick={() => {
                  if (!selectedOrgBadge.isFeatured && featuredCount >= 3) {
                    setOrgBadgePinLimit(true);
                    return;
                  }
                  const next = !selectedOrgBadge.isFeatured;
                  handleFeatureToggle(selectedOrgBadge.id, next);
                  setSelectedOrgBadge({ ...selectedOrgBadge, isFeatured: next });
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{
                  background: selectedOrgBadge.isFeatured ? "rgba(245,158,11,0.08)" : "var(--surface-alt)",
                  border: selectedOrgBadge.isFeatured ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                }}
              >
                <svg className={`w-4 h-4 shrink-0 ${selectedOrgBadge.isFeatured ? "text-amber-500" : "text-slate-400 dark:text-white/40"}`} fill={selectedOrgBadge.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${selectedOrgBadge.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-white/80"}`}>
                    {selectedOrgBadge.isFeatured ? "Unpin from profile" : "Pin to profile"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{selectedOrgBadge.isFeatured ? "Remove from pinned shelf" : "Show in pinned shelf (max 3)"}</p>
                </div>
              </button>

              {/* Delete */}
              <button
                onClick={() => setOrgBadgeDeleteConfirm(true)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete badge</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Permanently remove this badge</p>
                </div>
              </button>
            </div>

            <div className="px-5 pb-6">
              <button
                onClick={() => setSelectedOrgBadge(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {orgBadgeDeleteConfirm && selectedOrgBadge && (
        <DeleteConfirmModal
          title="Delete this badge?"
          message="This will permanently remove the badge and its image. This cannot be undone."
          onConfirm={() => {
            handleDelete(selectedOrgBadge.id);
            setOrgBadgeDeleteConfirm(false);
            setSelectedOrgBadge(null);
          }}
          onCancel={() => setOrgBadgeDeleteConfirm(false)}
        />
      )}

      {orgBadgePinLimit && (
        <InfoModal
          title="Pin limit reached"
          message="You can only pin up to 3 badges. Unpin one first to pin another."
          onClose={() => setOrgBadgePinLimit(false)}
        />
      )}

      {/* Domain-view badge action sheet */}
      {selectedDomainBadge && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedDomainBadge(null)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}>
                {selectedDomainBadge.imageUrl && !selectedDomainBadge.imageUrl.toLowerCase().endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedDomainBadge.imageUrl} alt={selectedDomainBadge.title} className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    {selectedDomainBadge.issuingOrganization.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedDomainBadge.title}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 truncate">{selectedDomainBadge.issuingOrganization}{selectedDomainBadge.domain ? ` · ${selectedDomainBadge.domain}` : ""}</p>
              </div>
              <button onClick={() => setSelectedDomainBadge(null)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Public visibility</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{selectedDomainBadge.isPublic ? "Visible on your public profile" : "Hidden from your public profile"}</p>
                </div>
                <button
                  onClick={() => {
                    handleVisibilityToggle(selectedDomainBadge.id, !selectedDomainBadge.isPublic);
                    setSelectedDomainBadge({ ...selectedDomainBadge, isPublic: !selectedDomainBadge.isPublic });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${selectedDomainBadge.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${selectedDomainBadge.isPublic ? "translate-x-[20px]" : "translate-x-0"}`} />
                </button>
              </div>
              <button
                onClick={() => { setSelectedDomainBadge(null); openEdit(selectedDomainBadge); }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Edit badge</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Update title, image, dates and more</p>
                </div>
              </button>
              <button
                onClick={() => {
                  if (!selectedDomainBadge.isFeatured && featuredCount >= 3) { setDomainBadgePinLimit(true); return; }
                  const next = !selectedDomainBadge.isFeatured;
                  handleFeatureToggle(selectedDomainBadge.id, next);
                  setSelectedDomainBadge({ ...selectedDomainBadge, isFeatured: next });
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{
                  background: selectedDomainBadge.isFeatured ? "rgba(245,158,11,0.08)" : "var(--surface-alt)",
                  border: selectedDomainBadge.isFeatured ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                }}
              >
                <svg className={`w-4 h-4 shrink-0 ${selectedDomainBadge.isFeatured ? "text-amber-500" : "text-slate-400 dark:text-white/40"}`} fill={selectedDomainBadge.isFeatured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${selectedDomainBadge.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-white/80"}`}>
                    {selectedDomainBadge.isFeatured ? "Unpin from profile" : "Pin to profile"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40">{selectedDomainBadge.isFeatured ? "Remove from pinned shelf" : "Show in pinned shelf (max 3)"}</p>
                </div>
              </button>
              <button
                onClick={() => setDomainBadgeDeleteConfirm(true)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete badge</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Permanently remove this badge</p>
                </div>
              </button>
            </div>

            <div className="px-5 pb-6">
              <button onClick={() => setSelectedDomainBadge(null)} className="w-full py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {domainBadgeDeleteConfirm && selectedDomainBadge && (
        <DeleteConfirmModal
          title="Delete this badge?"
          message="This will permanently remove the badge and its image. This cannot be undone."
          onConfirm={() => {
            handleDelete(selectedDomainBadge.id);
            setDomainBadgeDeleteConfirm(false);
            setSelectedDomainBadge(null);
          }}
          onCancel={() => setDomainBadgeDeleteConfirm(false)}
        />
      )}

      {domainBadgePinLimit && (
        <InfoModal
          title="Pin limit reached"
          message="You can only pin up to 3 badges. Unpin one first to pin another."
          onClose={() => setDomainBadgePinLimit(false)}
        />
      )}
    </div>
  );
}
