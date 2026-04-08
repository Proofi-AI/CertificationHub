"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Certificate, User } from "@prisma/client";
import type { UserFeatures } from "@/lib/features";
import { scoreCertificate } from "@/lib/certStrength";
import { DOMAIN_ACCENT } from "@/lib/constants";
import CertificateCard from "./CertificateCard";
import CertificateFormModal from "./CertificateFormModal";
import ProfileCompletenessCard from "@/components/ProfileCompletenessCard";
import InsightsCard from "@/components/InsightsCard";
import RecommendationsCard from "@/components/RecommendationsCard";
import SortControl, { type SortStrategy } from "@/components/SortControl";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import InfoModal from "@/components/InfoModal";

interface Props {
  initialCertificates: Certificate[];
  features: UserFeatures;
  profile: Pick<User, "avatarUrl" | "bio" | "slug" | "sortStrategy">;
  onCertificatesChange?: (certs: Certificate[]) => void;
  externalEdit?: Certificate | null;
  onExternalEditDone?: () => void;
  initialCertGroupOrder?: string;
  initialCertIssuerGroupOrder?: string;
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
    case "custom_domain":
    case "custom_issuer":
      return arr.sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
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
  initialCertGroupOrder,
  initialCertIssuerGroupOrder,
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
  const [sortError, setSortError] = useState<string | null>(null);
  const [domainSheetOpen, setDomainSheetOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragCancelTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const certsRef = useRef<Certificate[]>(initialCertificates);
  const domainTouchRef = useRef<{ domain: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const domainTouchOverRef = useRef<string | null>(null);
  const issuerTouchRef = useRef<{ issuer: string; startX: number; startY: number; active: boolean; timer: ReturnType<typeof setTimeout> | null } | null>(null);
  const issuerTouchOverRef = useRef<string | null>(null);

  // custom_domain state
  const [certGroupOrder, setCertGroupOrder] = useState<string[]>(() => {
    try { return JSON.parse(initialCertGroupOrder ?? "[]"); } catch { return []; }
  });
  const [draggedDomain, setDraggedDomain] = useState<string | null>(null);
  const [dragOverDomain, setDragOverDomain] = useState<string | null>(null);
  const [draggedCertInDomain, setDraggedCertInDomain] = useState<string | null>(null);
  const [dragOverCertInDomain, setDragOverCertInDomain] = useState<string | null>(null);
  const [selectedDomainCert, setSelectedDomainCert] = useState<Certificate | null>(null);
  const [domainCertDeleteConfirm, setDomainCertDeleteConfirm] = useState(false);
  const [domainCertPinLimit, setDomainCertPinLimit] = useState(false);

  // custom_issuer state
  const [certIssuerGroupOrder, setCertIssuerGroupOrder] = useState<string[]>(() => {
    try { return JSON.parse(initialCertIssuerGroupOrder ?? "[]"); } catch { return []; }
  });
  const [draggedIssuer, setDraggedIssuer] = useState<string | null>(null);
  const [dragOverIssuer, setDragOverIssuer] = useState<string | null>(null);
  const [draggedCertInIssuer, setDraggedCertInIssuer] = useState<string | null>(null);
  const [dragOverCertInIssuer, setDragOverCertInIssuer] = useState<string | null>(null);
  const [selectedIssuerCert, setSelectedIssuerCert] = useState<Certificate | null>(null);
  const [issuerCertDeleteConfirm, setIssuerCertDeleteConfirm] = useState(false);
  const [issuerCertPinLimit, setIssuerCertPinLimit] = useState(false);

  // Open edit modal when parent requests editing a specific cert
  useEffect(() => {
    if (externalEdit) {
      setEditTarget(externalEdit);
      setModalOpen(true);
    }
  }, [externalEdit]);

  // Prevent page scroll during active touch drag (non-passive listener required)
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (domainTouchRef.current?.active || issuerTouchRef.current?.active) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handler, { passive: false });
    return () => document.removeEventListener("touchmove", handler);
  }, []);

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cert: Certificate) => { setEditTarget(cert); setModalOpen(true); };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
    onExternalEditDone?.();
  };

  const update = (fn: (prev: Certificate[]) => Certificate[]) => {
    const next = fn(certsRef.current);
    certsRef.current = next;
    setCertificates(next);
    onCertificatesChange?.(next);
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

  const handleFeatureToggle = async (id: string, isFeatured: boolean) => {
    update((prev) => prev.map((c) => (c.id === id ? { ...c, isFeatured } : c)));
    await fetch(`/api/certificates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured }),
    });
  };

  /* ── Sort ─────────────────────────────────────────────────────────────── */

  const handleSortChange = (s: SortStrategy) => {
    setSortStrategy(s);
    setSortDirty(true);
    setSortError(null);
  };

  const handleSortSave = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortStrategy }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setSortDirty(false);
    } catch (e) {
      console.error("[Sort save error]", e);
      setSortError(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSortSaving(false);
    }
  };

  const handleSortSaveWithOrder = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      const sorted = sortCerts(certificates, "custom");
      const orderPayload = sorted.map((c, i) => ({ id: c.id, sortOrder: i }));

      const [r1, r2] = await Promise.all([
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
      if (!r1.ok || !r2.ok) {
        const b1 = await r1.json().catch(() => ({}));
        const b2 = await r2.json().catch(() => ({}));
        throw new Error(`profile: ${b1.error ?? r1.status} / reorder: ${b2.error ?? r2.status}`);
      }

      setSortDirty(false);
    } catch (e) {
      console.error("[Sort save error]", e);
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
        const domainCerts = certsByDomain[domain] ?? [];
        domainCerts.forEach((c, i) => orderPayload.push({ id: c.id, sortOrder: i }));
      }
      const [r1, r2] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortStrategy: "custom_domain", certGroupOrder: allDomainsForGroups }),
        }),
        fetch("/api/certificates/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed to save");
      setSortDirty(false);
    } catch (e) {
      console.error("[Sort save error]", e);
      setSortError(`Failed to save: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSortSaving(false);
    }
  };

  const handleSortSaveWithIssuerOrder = async () => {
    setSortSaving(true);
    setSortError(null);
    try {
      const orderPayload: { id: string; sortOrder: number }[] = [];
      for (const issuer of allIssuersForGroups) {
        const issuerCerts = certsByIssuer[issuer] ?? [];
        issuerCerts.forEach((c, i) => orderPayload.push({ id: c.id, sortOrder: i }));
      }
      const [r1, r2] = await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortStrategy: "custom_issuer", certIssuerGroupOrder: allIssuersForGroups }),
        }),
        fetch("/api/certificates/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: orderPayload }),
        }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("Failed to save");
      setSortDirty(false);
    } catch (e) {
      console.error("[Sort save error]", e);
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

  /* ── Drag & drop (custom_domain) ─────────────────────────────────────── */

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
    if (!draggedDomain || draggedDomain === targetDomain) {
      setDraggedDomain(null); setDragOverDomain(null); return;
    }
    setCertGroupOrder(() => {
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

  const handleCertInDomainDragStart = (e: React.DragEvent, certId: string) => {
    setDraggedCertInDomain(certId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCertInDomainDragOver = (e: React.DragEvent, certId: string) => {
    e.preventDefault();
    if (certId !== dragOverCertInDomain) setDragOverCertInDomain(certId);
  };
  const handleCertInDomainDrop = (e: React.DragEvent, targetId: string, domain: string) => {
    e.preventDefault();
    if (!draggedCertInDomain || draggedCertInDomain === targetId) {
      setDraggedCertInDomain(null); setDragOverCertInDomain(null); return;
    }
    const domainCerts = certsByDomain[domain] ?? [];
    const fromIdx = domainCerts.findIndex(c => c.id === draggedCertInDomain);
    const toIdx = domainCerts.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedCertInDomain(null); setDragOverCertInDomain(null); return; }
    const reordered = [...domainCerts];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    update(prev => prev.map(c => {
      const idx = reordered.findIndex(r => r.id === c.id);
      if (idx === -1) return c;
      return { ...c, sortOrder: idx };
    }));
    setSortDirty(true);
    setDraggedCertInDomain(null);
    setDragOverCertInDomain(null);
  };

  /* ── Drag & drop (custom_issuer) ────────────────────────────────────── */

  const handleIssuerDragStart = (e: React.DragEvent, issuer: string) => {
    setDraggedIssuer(issuer);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleIssuerDragOver = (e: React.DragEvent, issuer: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (issuer !== dragOverIssuer) setDragOverIssuer(issuer);
  };
  const handleIssuerDrop = (e: React.DragEvent, targetIssuer: string) => {
    e.preventDefault();
    if (!draggedIssuer || draggedIssuer === targetIssuer) {
      setDraggedIssuer(null); setDragOverIssuer(null); return;
    }
    setCertIssuerGroupOrder(() => {
      const current = allIssuersForGroups;
      const fromIdx = current.indexOf(draggedIssuer);
      const toIdx = current.indexOf(targetIssuer);
      const reordered = [...current];
      const [removed] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, removed);
      return reordered;
    });
    setSortDirty(true);
    setDraggedIssuer(null);
    setDragOverIssuer(null);
  };

  const handleCertInIssuerDragStart = (e: React.DragEvent, certId: string) => {
    setDraggedCertInIssuer(certId);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCertInIssuerDragOver = (e: React.DragEvent, certId: string) => {
    e.preventDefault();
    if (certId !== dragOverCertInIssuer) setDragOverCertInIssuer(certId);
  };
  const handleCertInIssuerDrop = (e: React.DragEvent, targetId: string, issuer: string) => {
    e.preventDefault();
    if (!draggedCertInIssuer || draggedCertInIssuer === targetId) {
      setDraggedCertInIssuer(null); setDragOverCertInIssuer(null); return;
    }
    const issuerCerts = certsByIssuer[issuer] ?? [];
    const fromIdx = issuerCerts.findIndex(c => c.id === draggedCertInIssuer);
    const toIdx = issuerCerts.findIndex(c => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { setDraggedCertInIssuer(null); setDragOverCertInIssuer(null); return; }
    const reordered = [...issuerCerts];
    const [removed] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, removed);
    update(prev => prev.map(c => {
      const idx = reordered.findIndex(r => r.id === c.id);
      if (idx === -1) return c;
      return { ...c, sortOrder: idx };
    }));
    setSortDirty(true);
    setDraggedCertInIssuer(null);
    setDragOverCertInIssuer(null);
  };

  /* ── Touch drag (domain groups — mobile) ────────────────────────────── */

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
    document.querySelectorAll<HTMLElement>("[data-cert-domain-id]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        const id = el.getAttribute("data-cert-domain-id");
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
      setCertGroupOrder(() => {
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

  /* ── Touch drag (issuer groups — mobile) ─────────────────────────────── */

  const handleIssuerTouchStart = (e: React.TouchEvent, issuer: string) => {
    const t = e.touches[0];
    if (issuerTouchRef.current?.timer) clearTimeout(issuerTouchRef.current.timer);
    const timer = setTimeout(() => {
      if (issuerTouchRef.current) {
        issuerTouchRef.current.active = true;
        setDraggedIssuer(issuer);
        navigator.vibrate?.(40);
      }
    }, 450);
    issuerTouchRef.current = { issuer, startX: t.clientX, startY: t.clientY, active: false, timer };
  };
  const handleIssuerTouchMove = (e: React.TouchEvent) => {
    if (!issuerTouchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - issuerTouchRef.current.startX;
    const dy = t.clientY - issuerTouchRef.current.startY;
    // If not yet in drag mode and finger moved too far — it's a scroll, cancel
    if (!issuerTouchRef.current.active) {
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        if (issuerTouchRef.current.timer) clearTimeout(issuerTouchRef.current.timer);
        issuerTouchRef.current = null;
      }
      return;
    }
    let targetIssuer: string | null = null;
    document.querySelectorAll<HTMLElement>("[data-cert-issuer-id]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (t.clientX >= rect.left && t.clientX <= rect.right && t.clientY >= rect.top && t.clientY <= rect.bottom) {
        const id = el.getAttribute("data-cert-issuer-id");
        if (id && id !== issuerTouchRef.current!.issuer) targetIssuer = id;
      }
    });
    if (targetIssuer !== issuerTouchOverRef.current) {
      setDragOverIssuer(targetIssuer);
      issuerTouchOverRef.current = targetIssuer;
    }
  };
  const handleIssuerTouchEnd = () => {
    if (issuerTouchRef.current?.timer) clearTimeout(issuerTouchRef.current.timer);
    if (!issuerTouchRef.current?.active) { issuerTouchRef.current = null; return; }
    const dragged = issuerTouchRef.current.issuer;
    const target = issuerTouchOverRef.current;
    if (dragged && target && dragged !== target) {
      setCertIssuerGroupOrder(() => {
        const current = allIssuersForGroups;
        const fromIdx = current.indexOf(dragged);
        const toIdx = current.indexOf(target);
        const reordered = [...current];
        const [removed] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, removed);
        return reordered;
      });
      setSortDirty(true);
    }
    issuerTouchRef.current = null;
    issuerTouchOverRef.current = null;
    setDraggedIssuer(null);
    setDragOverIssuer(null);
  };

  /* ── Derived state ────────────────────────────────────────────────────── */

  const totalCount = certificates.length;
  const publicCount = certificates.filter((c) => c.isPublic).length;
  const featuredCount = useMemo(() => certificates.filter((c) => c.isFeatured).length, [certificates]);
  const privateCount = totalCount - publicCount;
  const domainCount = useMemo(() => new Set(certificates.map((c) => c.domain)).size, [certificates]);
  const allDomains = useMemo(() => ["All", ...Array.from(new Set(certificates.map((c) => c.domain)))], [certificates]);

  const allDomainsForGroups = useMemo(() => {
    const domains = Array.from(new Set(certificates.map(c => c.domain)));
    const ordered = certGroupOrder.filter(d => domains.includes(d));
    const unordered = domains.filter(d => !certGroupOrder.includes(d));
    return [...ordered, ...unordered];
  }, [certificates, certGroupOrder]);

  const certsByDomain = useMemo(() => {
    const groups: Record<string, Certificate[]> = {};
    for (const domain of allDomainsForGroups) {
      groups[domain] = certificates
        .filter(c => c.domain === domain)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    }
    return groups;
  }, [certificates, allDomainsForGroups]);

  const allIssuersForGroups = useMemo(() => {
    const issuers = Array.from(new Set(certificates.map(c => c.issuer).filter(Boolean)));
    const ordered = certIssuerGroupOrder.filter(i => issuers.includes(i));
    const unordered = issuers.filter(i => !certIssuerGroupOrder.includes(i));
    return [...ordered, ...unordered];
  }, [certificates, certIssuerGroupOrder]);

  const certsByIssuer = useMemo(() => {
    const groups: Record<string, Certificate[]> = {};
    for (const issuer of allIssuersForGroups) {
      groups[issuer] = certificates
        .filter(c => c.issuer === issuer)
        .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999));
    }
    return groups;
  }, [certificates, allIssuersForGroups]);

  const sortedAndFiltered = useMemo(() => {
    let sorted: Certificate[];
    if (sortStrategy === "custom_domain") {
      sorted = [...certificates].sort((a, b) => {
        const aDomainIdx = allDomainsForGroups.indexOf(a.domain);
        const bDomainIdx = allDomainsForGroups.indexOf(b.domain);
        const aIdx = aDomainIdx === -1 ? 9999 : aDomainIdx;
        const bIdx = bDomainIdx === -1 ? 9999 : bDomainIdx;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      });
    } else if (sortStrategy === "custom_issuer") {
      sorted = [...certificates].sort((a, b) => {
        const aIssuerIdx = allIssuersForGroups.indexOf(a.issuer);
        const bIssuerIdx = allIssuersForGroups.indexOf(b.issuer);
        const aIdx = aIssuerIdx === -1 ? 9999 : aIssuerIdx;
        const bIdx = bIssuerIdx === -1 ? 9999 : bIssuerIdx;
        if (aIdx !== bIdx) return aIdx - bIdx;
        return (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999);
      });
    } else {
      sorted = sortCerts(certificates, sortStrategy);
    }
    return sorted.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.issuer.toLowerCase().includes(q);
      const matchDomain = domainFilter === "All" || c.domain === domainFilter;
      return matchSearch && matchDomain;
    });
  }, [certificates, search, domainFilter, sortStrategy, allDomainsForGroups]);

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

      {/* Portfolio insights widgets — only visible when feature flag is on */}
      {features.portfolioInsights && (
        <>
          <ProfileCompletenessCard
            certificates={certificates}
            avatarUrl={profile.avatarUrl}
            bio={profile.bio}
            slug={profile.slug}
          />
          <InsightsCard certificates={certificates} />
          <RecommendationsCard certificates={certificates} />
        </>
      )}

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
          <div className="flex items-center gap-2 min-w-0">
            {allDomains.length > 2 && (
              <>
                {/* Desktop domain select */}
                <select
                  value={domainFilter}
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="hidden sm:block rounded-xl px-3 py-2.5 text-sm outline-none transition-all cursor-pointer
                    bg-black/[0.04] border border-black/[0.08] focus:border-violet-500/40 text-slate-700
                    dark:bg-white/[0.06] dark:border-white/[0.11] dark:text-white/75"
                >
                  {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {/* Mobile domain filter button */}
                <button
                  onClick={() => setDomainSheetOpen(true)}
                  className="sm:hidden flex items-center gap-1.5 min-w-0 flex-1 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all
                    text-slate-600 dark:text-white/70 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                  <span className="truncate">{domainFilter === "All" ? "All domains" : domainFilter}</span>
                </button>
              </>
            )}
            <SortControl
              value={sortStrategy}
              onChange={handleSortChange}
              isDirty={sortDirty}
              onSave={
                sortStrategy === "custom"
                  ? handleSortSaveWithOrder
                  : sortStrategy === "custom_domain"
                  ? handleSortSaveWithDomainOrder
                  : sortStrategy === "custom_issuer"
                  ? handleSortSaveWithIssuerOrder
                  : handleSortSave
              }
              saving={sortSaving}
            />
          </div>
        </div>
      )}

      {/* Mobile: Domain filter bottom sheet */}
      {domainSheetOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setDomainSheetOpen(false)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Filter by domain</p>
              <button onClick={() => setDomainSheetOpen(false)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="py-2 max-h-[60vh] overflow-y-auto">
              {allDomains.map((d) => (
                <button
                  key={d}
                  onClick={() => { setDomainFilter(d); setDomainSheetOpen(false); }}
                  className="w-full flex items-center justify-between px-5 py-3.5 transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                >
                  <p className={`text-sm font-semibold ${domainFilter === d ? "text-violet-600 dark:text-violet-400" : "text-slate-800 dark:text-white"}`}>
                    {d}
                  </p>
                  {domainFilter === d && (
                    <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-5 pb-6 pt-2">
              <button
                onClick={() => setDomainSheetOpen(false)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all
                  text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort error */}
      {sortError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {sortError}
        </div>
      )}

      {/* Hints */}
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
      {sortStrategy === "custom_domain" && totalCount > 0 && !isFiltered && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          Drag domain groups to reorder. Drag certificates within a group to reorder. Click Save when done.
        </div>
      )}
      {sortStrategy === "custom_domain" && totalCount > 0 && isFiltered && (
        <div className="text-xs text-slate-400 dark:text-white/40 text-center py-2">
          Clear search and filters to use domain grouping.
        </div>
      )}
      {sortStrategy === "custom_issuer" && totalCount > 0 && !isFiltered && (
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-white/40 py-1 px-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
          Drag issuer groups to reorder. Drag certificates within a group to reorder. Click Save when done.
        </div>
      )}
      {sortStrategy === "custom_issuer" && totalCount > 0 && isFiltered && (
        <div className="text-xs text-slate-400 dark:text-white/40 text-center py-2">
          Clear search and filters to use issuer grouping.
        </div>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="relative rounded-3xl overflow-hidden p-8 sm:p-16 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
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

      {/* Domain grouped view */}
      {sortStrategy === "custom_domain" && !isFiltered && totalCount > 0 && (
        <div className="space-y-3">
          {allDomainsForGroups.map(domain => {
            const accent = DOMAIN_ACCENT[domain] ?? DOMAIN_ACCENT["Other"];
            return (
              <div
                key={domain}
                data-cert-domain-id={domain}
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
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accent.from }} />
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{domain}</span>
                  <span className="text-xs text-slate-400 dark:text-white/40 ml-auto">
                    {certsByDomain[domain]?.length ?? 0} cert{(certsByDomain[domain]?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Certificates grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(certsByDomain[domain] ?? []).map(cert => {
                    const certAccent = DOMAIN_ACCENT[cert.domain] ?? DOMAIN_ACCENT["Other"];
                    const isPdf = cert.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
                    const issuerInitials = (cert.issuer || "?")
                      .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    const isDragOverCert = !draggedDomain && dragOverCertInDomain === cert.id;

                    return (
                      <div
                        key={cert.id}
                        draggable={!draggedDomain}
                        onDragStart={(e) => { if (draggedDomain) return; e.stopPropagation(); handleCertInDomainDragStart(e, cert.id); }}
                        onDragOver={(e) => { if (draggedDomain) return; e.stopPropagation(); handleCertInDomainDragOver(e, cert.id); }}
                        onDrop={(e) => { if (draggedDomain) return; e.stopPropagation(); handleCertInDomainDrop(e, cert.id, domain); }}
                        onDragEnd={() => { if (draggedDomain) return; setDraggedCertInDomain(null); setDragOverCertInDomain(null); }}
                        onClick={() => { if (!draggedCertInDomain) setSelectedDomainCert(cert); }}
                        className="relative rounded-xl overflow-hidden flex flex-col transition-all"
                        style={{
                          background: "var(--surface)",
                          border: isDragOverCert ? "2px dashed #7c3aed" : `1.5px solid ${certAccent.from}33`,
                          boxShadow: isDragOverCert ? "0 0 0 3px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                          opacity: draggedCertInDomain === cert.id ? 0.5 : 1,
                          cursor: draggedDomain ? "grabbing" : "pointer",
                          pointerEvents: draggedDomain ? "none" : "auto",
                          filter: !cert.isPublic ? "grayscale(0.65)" : "none",
                        }}
                        title={cert.name}
                      >
                        {/* Domain accent bar */}
                        <div className="h-[3px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${certAccent.from}, ${certAccent.to})` }} />

                        {/* Certificate image */}
                        <div
                          className="relative h-32 sm:h-36 overflow-hidden shrink-0"
                          style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
                        >
                          {cert.imageUrl && !isPdf ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cert.imageUrl}
                                alt=""
                                aria-hidden
                                className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30 pointer-events-none"
                              />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={cert.imageUrl}
                                alt={cert.name}
                                className="absolute inset-0 w-full h-full object-contain"
                              />
                            </>
                          ) : cert.imageUrl && isPdf ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-white/30">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <span className="text-[10px] font-medium">PDF</span>
                            </div>
                          ) : (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-lg font-black text-white"
                              style={{ background: `linear-gradient(135deg, ${certAccent.from}, ${certAccent.to})` }}
                            >
                              {issuerInitials}
                            </div>
                          )}

                          {/* Private overlay */}
                          {!cert.isPublic && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-6 h-6 text-white/60 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            </div>
                          )}

                          {/* Featured star */}
                          {cert.isFeatured && (
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: "rgba(245,158,11,0.25)" }}>
                              <svg className="w-3 h-3 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="px-2.5 py-2.5 flex-1">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{cert.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/40 truncate mt-0.5">{cert.issuer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issuer grouped view */}
      {sortStrategy === "custom_issuer" && !isFiltered && totalCount > 0 && (
        <div className="space-y-3">
          {allIssuersForGroups.map(issuer => {
            const issuerInitials = (issuer || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            return (
              <div
                key={issuer}
                data-cert-issuer-id={issuer}
                draggable
                onDragStart={(e) => handleIssuerDragStart(e, issuer)}
                onDragOver={(e) => handleIssuerDragOver(e, issuer)}
                onDrop={(e) => handleIssuerDrop(e, issuer)}
                onDragEnd={() => { setDraggedIssuer(null); setDragOverIssuer(null); }}
                onTouchStart={(e) => handleIssuerTouchStart(e, issuer)}
                onTouchMove={handleIssuerTouchMove}
                onTouchEnd={handleIssuerTouchEnd}
                className="rounded-2xl p-4 transition-all"
                style={{
                  background: "var(--surface)",
                  border: dragOverIssuer === issuer ? "2px dashed #7c3aed" : "1px solid var(--border)",
                  boxShadow: dragOverIssuer === issuer ? "0 0 0 4px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                  opacity: draggedIssuer === issuer ? 0.6 : 1,
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                {/* Issuer header */}
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-slate-400 dark:text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                  </svg>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[9px] font-black text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    {issuerInitials}
                  </div>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{issuer}</span>
                  <span className="text-xs text-slate-400 dark:text-white/40 ml-auto">
                    {certsByIssuer[issuer]?.length ?? 0} cert{(certsByIssuer[issuer]?.length ?? 0) !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Certificates grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {(certsByIssuer[issuer] ?? []).map(cert => {
                    const certAccent = DOMAIN_ACCENT[cert.domain] ?? DOMAIN_ACCENT["Other"];
                    const isPdf = cert.imageUrl?.toLowerCase().endsWith(".pdf") ?? false;
                    const certInitials = (cert.issuer || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                    const isDragOverCert = !draggedIssuer && dragOverCertInIssuer === cert.id;

                    return (
                      <div
                        key={cert.id}
                        draggable={!draggedIssuer}
                        onDragStart={(e) => { if (draggedIssuer) return; e.stopPropagation(); handleCertInIssuerDragStart(e, cert.id); }}
                        onDragOver={(e) => { if (draggedIssuer) return; e.stopPropagation(); handleCertInIssuerDragOver(e, cert.id); }}
                        onDrop={(e) => { if (draggedIssuer) return; e.stopPropagation(); handleCertInIssuerDrop(e, cert.id, issuer); }}
                        onDragEnd={() => { if (draggedIssuer) return; setDraggedCertInIssuer(null); setDragOverCertInIssuer(null); }}
                        onClick={() => { if (!draggedCertInIssuer) setSelectedIssuerCert(cert); }}
                        className="relative rounded-xl overflow-hidden flex flex-col transition-all"
                        style={{
                          background: "var(--surface)",
                          border: isDragOverCert ? "2px dashed #7c3aed" : `1.5px solid ${certAccent.from}33`,
                          boxShadow: isDragOverCert ? "0 0 0 3px rgba(124,58,237,0.12)" : "var(--card-shadow)",
                          opacity: draggedCertInIssuer === cert.id ? 0.5 : 1,
                          cursor: draggedIssuer ? "grabbing" : "pointer",
                          pointerEvents: draggedIssuer ? "none" : "auto",
                          filter: !cert.isPublic ? "grayscale(0.65)" : "none",
                        }}
                        title={cert.name}
                      >
                        {/* Domain accent bar */}
                        <div className="h-[3px] w-full shrink-0" style={{ background: `linear-gradient(90deg, ${certAccent.from}, ${certAccent.to})` }} />

                        {/* Certificate image */}
                        <div
                          className="relative h-32 sm:h-36 overflow-hidden shrink-0"
                          style={{ background: "var(--surface-alt)", borderBottom: "1px solid var(--border)" }}
                        >
                          {cert.imageUrl && !isPdf ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={cert.imageUrl} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-30 pointer-events-none" />
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={cert.imageUrl} alt={cert.name} className="absolute inset-0 w-full h-full object-contain" />
                            </>
                          ) : cert.imageUrl && isPdf ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-white/30">
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              <span className="text-[10px] font-medium">PDF</span>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-white"
                              style={{ background: `linear-gradient(135deg, ${certAccent.from}, ${certAccent.to})` }}>
                              {certInitials}
                            </div>
                          )}

                          {/* Private overlay */}
                          {!cert.isPublic && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <svg className="w-6 h-6 text-white/60 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                              </svg>
                            </div>
                          )}

                          {/* Featured star */}
                          {cert.isFeatured && (
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 flex items-center justify-center rounded-full" style={{ background: "rgba(245,158,11,0.25)" }}>
                              <svg className="w-3 h-3 text-amber-400 drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Text */}
                        <div className="px-2.5 py-2.5 flex-1">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{cert.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-white/40 truncate mt-0.5">{cert.domain}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regular grid — hidden when custom_domain or custom_issuer is active and unfiltered */}
      {(sortStrategy !== "custom_domain" && sortStrategy !== "custom_issuer" || isFiltered) && sortedAndFiltered.length > 0 && (
        <div
          className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5"
          onDragLeave={() => {
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
              onFeatureToggle={handleFeatureToggle}
              featuredCount={featuredCount}
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
        <CertificateFormModal initialData={editTarget} onSave={handleSave} onClose={closeModal} autoFillEnabled={features.autoFillFromImage} aiVerificationEnabled={features.aiVerification} />
      )}

      {/* Domain-view certificate action sheet */}
      {selectedDomainCert && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedDomainCert(null)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                {selectedDomainCert.imageUrl && !selectedDomainCert.imageUrl.toLowerCase().endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedDomainCert.imageUrl} alt={selectedDomainCert.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${(DOMAIN_ACCENT[selectedDomainCert.domain] ?? DOMAIN_ACCENT["Other"]).from}, ${(DOMAIN_ACCENT[selectedDomainCert.domain] ?? DOMAIN_ACCENT["Other"]).to})` }}
                  >
                    {selectedDomainCert.issuer.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedDomainCert.name}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 truncate">{selectedDomainCert.issuer} · {selectedDomainCert.domain}</p>
              </div>
              <button onClick={() => setSelectedDomainCert(null)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
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
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {selectedDomainCert.isPublic ? "Visible on your public profile" : "Hidden from your public profile"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleVisibilityToggle(selectedDomainCert.id, !selectedDomainCert.isPublic);
                    setSelectedDomainCert({ ...selectedDomainCert, isPublic: !selectedDomainCert.isPublic });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${selectedDomainCert.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${selectedDomainCert.isPublic ? "translate-x-[20px]" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Edit */}
              <button
                onClick={() => { setSelectedDomainCert(null); openEdit(selectedDomainCert); }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Edit certificate</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Update name, image, dates and more</p>
                </div>
              </button>

              {/* Pin / unpin */}
              <button
                onClick={() => {
                  if (!selectedDomainCert.isFeatured && featuredCount >= 3) {
                    setDomainCertPinLimit(true);
                    return;
                  }
                  const next = !selectedDomainCert.isFeatured;
                  handleFeatureToggle(selectedDomainCert.id, next);
                  setSelectedDomainCert({ ...selectedDomainCert, isFeatured: next });
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{
                  background: selectedDomainCert.isFeatured ? "rgba(245,158,11,0.08)" : "var(--surface-alt)",
                  border: selectedDomainCert.isFeatured ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                }}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${selectedDomainCert.isFeatured ? "text-amber-500" : "text-slate-400 dark:text-white/40"}`}
                  fill={selectedDomainCert.isFeatured ? "currentColor" : "none"}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${selectedDomainCert.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-white/80"}`}>
                    {selectedDomainCert.isFeatured ? "Unpin from profile" : "Pin to profile"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {selectedDomainCert.isFeatured ? "Remove from pinned shelf" : "Show in pinned shelf (max 3)"}
                  </p>
                </div>
              </button>

              {/* Delete */}
              <button
                onClick={() => setDomainCertDeleteConfirm(true)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete certificate</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Permanently remove this certificate</p>
                </div>
              </button>
            </div>

            <div className="px-5 pb-6">
              <button
                onClick={() => setSelectedDomainCert(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {domainCertDeleteConfirm && selectedDomainCert && (
        <DeleteConfirmModal
          title="Delete this certificate?"
          message="This will permanently remove the certificate and its image. This cannot be undone."
          onConfirm={() => {
            handleDelete(selectedDomainCert.id);
            setDomainCertDeleteConfirm(false);
            setSelectedDomainCert(null);
          }}
          onCancel={() => setDomainCertDeleteConfirm(false)}
        />
      )}

      {domainCertPinLimit && (
        <InfoModal
          title="Pin limit reached"
          message="You can only pin up to 3 certificates. Unpin one first to pin another."
          onClose={() => setDomainCertPinLimit(false)}
        />
      )}

      {/* Issuer-view certificate action sheet */}
      {selectedIssuerCert && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedIssuerCert(null)}
        >
          <div
            className="rounded-t-2xl overflow-hidden w-full"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                {selectedIssuerCert.imageUrl && !selectedIssuerCert.imageUrl.toLowerCase().endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedIssuerCert.imageUrl} alt={selectedIssuerCert.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: `linear-gradient(135deg, ${(DOMAIN_ACCENT[selectedIssuerCert.domain] ?? DOMAIN_ACCENT["Other"]).from}, ${(DOMAIN_ACCENT[selectedIssuerCert.domain] ?? DOMAIN_ACCENT["Other"]).to})` }}
                  >
                    {selectedIssuerCert.issuer.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedIssuerCert.name}</p>
                <p className="text-xs text-slate-400 dark:text-white/40 truncate">{selectedIssuerCert.issuer} · {selectedIssuerCert.domain}</p>
              </div>
              <button onClick={() => setSelectedIssuerCert(null)} className="text-slate-400 dark:text-white/40 hover:text-slate-700 dark:hover:text-white transition-colors">
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
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {selectedIssuerCert.isPublic ? "Visible on your public profile" : "Hidden from your public profile"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    handleVisibilityToggle(selectedIssuerCert.id, !selectedIssuerCert.isPublic);
                    setSelectedIssuerCert({ ...selectedIssuerCert, isPublic: !selectedIssuerCert.isPublic });
                  }}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${selectedIssuerCert.isPublic ? "bg-emerald-500" : "bg-slate-300 dark:bg-white/15"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200 ${selectedIssuerCert.isPublic ? "translate-x-[20px]" : "translate-x-0"}`} />
                </button>
              </div>

              {/* Edit */}
              <button
                onClick={() => { setSelectedIssuerCert(null); openEdit(selectedIssuerCert); }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "var(--surface-alt)", border: "1px solid var(--border)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-slate-500 dark:text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-white/80">Edit certificate</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Update name, image, dates and more</p>
                </div>
              </button>

              {/* Pin / unpin */}
              <button
                onClick={() => {
                  if (!selectedIssuerCert.isFeatured && featuredCount >= 3) {
                    setIssuerCertPinLimit(true);
                    return;
                  }
                  const next = !selectedIssuerCert.isFeatured;
                  handleFeatureToggle(selectedIssuerCert.id, next);
                  setSelectedIssuerCert({ ...selectedIssuerCert, isFeatured: next });
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{
                  background: selectedIssuerCert.isFeatured ? "rgba(245,158,11,0.08)" : "var(--surface-alt)",
                  border: selectedIssuerCert.isFeatured ? "1px solid rgba(245,158,11,0.25)" : "1px solid var(--border)",
                }}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${selectedIssuerCert.isFeatured ? "text-amber-500" : "text-slate-400 dark:text-white/40"}`}
                  fill={selectedIssuerCert.isFeatured ? "currentColor" : "none"}
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <div>
                  <p className={`text-sm font-semibold ${selectedIssuerCert.isFeatured ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-white/80"}`}>
                    {selectedIssuerCert.isFeatured ? "Unpin from profile" : "Pin to profile"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-white/40">
                    {selectedIssuerCert.isFeatured ? "Remove from pinned shelf" : "Show in pinned shelf (max 3)"}
                  </p>
                </div>
              </button>

              {/* Delete */}
              <button
                onClick={() => setIssuerCertDeleteConfirm(true)}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl transition-all text-left"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              >
                <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete certificate</p>
                  <p className="text-xs text-slate-400 dark:text-white/40">Permanently remove this certificate</p>
                </div>
              </button>
            </div>

            <div className="px-5 pb-6">
              <button
                onClick={() => setSelectedIssuerCert(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold transition-all text-slate-600 dark:text-white/65 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {issuerCertDeleteConfirm && selectedIssuerCert && (
        <DeleteConfirmModal
          title="Delete this certificate?"
          message="This will permanently remove the certificate and its image. This cannot be undone."
          onConfirm={() => {
            handleDelete(selectedIssuerCert.id);
            setIssuerCertDeleteConfirm(false);
            setSelectedIssuerCert(null);
          }}
          onCancel={() => setIssuerCertDeleteConfirm(false)}
        />
      )}

      {issuerCertPinLimit && (
        <InfoModal
          title="Pin limit reached"
          message="You can only pin up to 3 certificates. Unpin one first to pin another."
          onClose={() => setIssuerCertPinLimit(false)}
        />
      )}
    </div>
  );
}
