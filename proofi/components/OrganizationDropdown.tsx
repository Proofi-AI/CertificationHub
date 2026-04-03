"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_ORGANIZATIONS } from "@/lib/defaultOrganizations";

interface CustomOrg {
  id: string;
  name: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  customOrgs: CustomOrg[];
  onCustomOrgsChange: (orgs: CustomOrg[]) => void;
  error?: string;
}

export default function OrganizationDropdown({
  value,
  onChange,
  customOrgs,
  onCustomOrgsChange,
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgError, setNewOrgError] = useState<string | null>(null);
  const [addingSaving, setAddingSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomOrg | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const newOrgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  useEffect(() => {
    if (addModalOpen) {
      setTimeout(() => newOrgRef.current?.focus(), 50);
    } else {
      setNewOrgName("");
      setNewOrgError(null);
    }
  }, [addModalOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allOrgs = [
    ...DEFAULT_ORGANIZATIONS.map((name) => ({ id: `default:${name}`, name, isDefault: true })),
    ...customOrgs.map((o) => ({ id: o.id, name: o.name, isDefault: false })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search.trim()
    ? allOrgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : allOrgs;

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const handleAddSave = async () => {
    const trimmed = newOrgName.trim();
    if (trimmed.length < 2) {
      setNewOrgError("Name must be at least 2 characters.");
      return;
    }

    const exists = allOrgs.some((o) => o.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewOrgError("This organization already exists.");
      return;
    }

    setAddingSaving(true);
    setNewOrgError(null);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) {
        setNewOrgError(json.error || "Failed to save.");
        return;
      }
      onCustomOrgsChange([...customOrgs, json.data]);
      onChange(trimmed);
      setAddModalOpen(false);
      setOpen(false);
    } catch {
      setNewOrgError("Failed to save. Please try again.");
    } finally {
      setAddingSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await fetch(`/api/organizations/${deleteTarget.id}`, { method: "DELETE" });
      onCustomOrgsChange(customOrgs.filter((o) => o.id !== deleteTarget.id));
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
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm transition-all text-left outline-none
            bg-black/[0.04] border focus:ring-1 focus:ring-violet-500/20
            dark:bg-white/[0.06]
            ${error
              ? "border-red-500/40 focus:border-red-500/60"
              : open
              ? "border-violet-500/40 focus:border-violet-500/40"
              : "border-black/[0.08] focus:border-violet-500/40 dark:border-white/[0.11]"
            }
            ${value ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-white/35"}`}
        >
          <span className="truncate">{value || "Select organization"}</span>
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
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-hover)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            }}
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
                  placeholder="Search organizations…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none
                    bg-black/[0.04] dark:bg-white/[0.05]
                    text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-white/40 text-center py-4">No results</p>
              )}
              {filtered.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all"
                  style={value === org.name ? { background: "rgba(124,58,237,0.08)" } : undefined}
                  onClick={() => handleSelect(org.name)}
                  onMouseEnter={(e) => {
                    if (value !== org.name) {
                      (e.currentTarget as HTMLDivElement).style.background = "var(--hover-bg)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== org.name) {
                      (e.currentTarget as HTMLDivElement).style.background = "";
                    }
                  }}
                >
                  <span className="flex-1 text-sm text-slate-800 dark:text-white/90 truncate">{org.name}</span>
                  {!org.isDefault && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Custom
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: org.id, name: org.name });
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded-md text-slate-400 hover:text-red-500 dark:text-white/30 dark:hover:text-red-400 transition-colors"
                        title="Delete organization"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {value === org.name && (
                    <svg className="w-3.5 h-3.5 text-violet-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
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
                Add custom organization...
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add organization modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-hover)" }}
          >
            <h3 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Add custom organization</h3>
            <input
              ref={newOrgRef}
              value={newOrgName}
              onChange={(e) => { setNewOrgName(e.target.value); setNewOrgError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddSave(); if (e.key === "Escape") setAddModalOpen(false); }}
              placeholder="Organization name"
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all mb-1
                bg-black/[0.04] dark:bg-white/[0.06]
                text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                border focus:ring-1 focus:ring-violet-500/20
                ${newOrgError ? "border-red-500/40" : "border-black/[0.08] dark:border-white/[0.11] focus:border-violet-500/40"}`}
            />
            {newOrgError && (
              <p className="text-xs text-red-500 dark:text-red-400 mb-3">{newOrgError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleAddSave}
                disabled={addingSaving || !newOrgName.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                {addingSaving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                  text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08]
                  dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]"
              >
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
          <div
            className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border-hover)" }}
          >
            <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">Delete {deleteTarget.name}?</h3>
            <p className="text-sm mb-5 text-slate-500 dark:text-white/55">
              All badges using this organization will have their organization field cleared. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={!!deletingId}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                {deletingId ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all
                  text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08]
                  dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
