"use client";

import { useEffect, useRef, useState } from "react";
import { DOMAINS } from "@/lib/constants";

interface CustomDomain {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  customDomains: CustomDomain[];
  onCustomDomainsChange: (domains: CustomDomain[]) => void;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

// Static domain names (excluding legacy "Other")
const STATIC_DOMAINS = DOMAINS.filter((d) => d.value !== "Other").map((d) => d.value as string);

export default function DomainDropdown({
  value,
  onChange,
  customDomains,
  onCustomDomainsChange,
  required,
  error,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [newDomainError, setNewDomainError] = useState<string | null>(null);
  const [addingSaving, setAddingSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomDomain | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newDomainRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  useEffect(() => {
    if (addModalOpen) setTimeout(() => newDomainRef.current?.focus(), 50);
    else { setNewDomainName(""); setNewDomainError(null); }
  }, [addModalOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allDomains = [
    ...STATIC_DOMAINS.map((name) => ({ id: `static:${name}`, name, isDefault: true })),
    ...customDomains.map((d) => ({ id: d.id, name: d.name, isDefault: false })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search.trim()
    ? allDomains.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : allDomains;

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const handleAddSave = async () => {
    const trimmed = newDomainName.trim();
    if (trimmed.length < 2) {
      setNewDomainError("Name must be at least 2 characters.");
      return;
    }
    const exists = allDomains.some((d) => d.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewDomainError("This domain already exists.");
      return;
    }
    setAddingSaving(true);
    setNewDomainError(null);
    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) { setNewDomainError(json.error || "Failed to save."); return; }
      onCustomDomainsChange([...customDomains, json.data]);
      onChange(trimmed);
      setAddModalOpen(false);
      setOpen(false);
    } catch {
      setNewDomainError("Failed to save. Please try again.");
    } finally {
      setAddingSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await fetch(`/api/domains/${deleteTarget.id}`, { method: "DELETE" });
      onCustomDomainsChange(customDomains.filter((d) => d.id !== deleteTarget.id));
      if (value === deleteTarget.name) onChange("");
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm transition-all text-left outline-none
            bg-black/[0.04] border focus:ring-1 focus:ring-violet-500/20
            dark:bg-white/[0.06]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error
              ? "border-red-500/40 focus:border-red-500/60"
              : open
              ? "border-violet-500/40"
              : "border-black/[0.08] dark:border-white/[0.11]"
            }
            ${value ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/35"}`}
        >
          <span className="truncate">{value || (required ? "Select domain" : "No domain")}</span>
          <svg
            className={`w-4 h-4 shrink-0 text-slate-400 dark:text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 12px 40px rgba(0,0,0,0.2)" }}
          >
            {/* Search */}
            <div className="p-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search domains…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none bg-black/[0.04] dark:bg-white/[0.05] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto">
              {!required && (
                <div
                  className="flex items-center px-3 py-2.5 cursor-pointer transition-all"
                  style={!value ? { background: "rgba(124,58,237,0.08)" } : undefined}
                  onClick={handleClear}
                  onMouseEnter={(e) => { if (value) (e.currentTarget as HTMLDivElement).style.background = "var(--hover-bg)"; }}
                  onMouseLeave={(e) => { if (value) (e.currentTarget as HTMLDivElement).style.background = ""; }}
                >
                  <span className="flex-1 text-sm text-slate-400 dark:text-white/40 italic">No domain</span>
                  {!value && <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                </div>
              )}
              {filtered.length === 0 && <p className="text-xs text-slate-400 dark:text-white/40 text-center py-4">No results</p>}
              {filtered.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all"
                  style={value === domain.name ? { background: "rgba(124,58,237,0.08)" } : undefined}
                  onClick={() => handleSelect(domain.name)}
                  onMouseEnter={(e) => { if (value !== domain.name) (e.currentTarget as HTMLDivElement).style.background = "var(--hover-bg)"; }}
                  onMouseLeave={(e) => { if (value !== domain.name) (e.currentTarget as HTMLDivElement).style.background = ""; }}
                >
                  <span className="flex-1 text-sm text-slate-800 dark:text-white/90 truncate">{domain.name}</span>
                  {!domain.isDefault && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">Custom</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: domain.id, name: domain.name }); }}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 transition-colors"
                        title="Delete domain"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {value === domain.name && (
                    <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  )}
                </div>
              ))}
            </div>

            {/* Add custom */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => { setAddModalOpen(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add custom domain...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add domain modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-hover)" }}>
            <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Add custom domain</h3>
            <input
              ref={newDomainRef}
              value={newDomainName}
              onChange={(e) => { setNewDomainName(e.target.value); setNewDomainError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddSave(); if (e.key === "Escape") setAddModalOpen(false); }}
              placeholder="e.g. Blockchain, Robotics…"
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all mb-1
                bg-black/[0.04] dark:bg-white/[0.06]
                text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                border focus:ring-1 focus:ring-violet-500/20
                ${newDomainError ? "border-red-500/40" : "border-black/[0.08] dark:border-white/[0.11] focus:border-violet-500/40"}`}
            />
            {newDomainError && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{newDomainError}</p>}
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleAddSave} disabled={addingSaving || !newDomainName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                {addingSaving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08] dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border-hover)" }}>
            <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">Delete &ldquo;{deleteTarget.name}&rdquo;?</h3>
            <p className="text-sm mb-5 text-slate-500 dark:text-white/55">
              This domain will be removed from your list. Existing entries using it will keep their domain value.
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={handleDeleteConfirm} disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50">
                {deletingId ? "Deleting…" : "Delete"}
              </button>
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08] dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
