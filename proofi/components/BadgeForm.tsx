"use client";

import { useEffect, useRef, useState } from "react";
import type { Badge } from "@prisma/client";
import { compressImage } from "@/lib/compressImage";
import { smartCropBadge } from "@/lib/smartCrop";
import { uploadBadgeImage } from "@/lib/utils/storage";
import OrganizationDropdown from "@/components/OrganizationDropdown";
import DomainDropdown from "@/components/DomainDropdown";

interface CustomOrg {
  id: string;
  name: string;
}

interface CustomDomain {
  id: string;
  name: string;
}

interface LeetCodeBadge {
  title: string;
  issuingOrganization: string;
  description: string | null;
  issuedAt: string | null;
  imageUrl: string | null;
  credentialUrl: string | null;
  originalId: string;
}

interface Props {
  initialData: Badge | null;
  onSave: (badge: Badge) => void;
  onClose: () => void;
  initialCustomOrgs?: CustomOrg[];
  initialCustomDomains?: CustomDomain[];
}

const toInputDate = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

function getFileCategory(file: File): "image" | "svg" | "pdf" | "other" {
  if (file.type === "image/svg+xml" || file.name.endsWith(".svg")) return "svg";
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || file.name.endsWith(".pdf")) return "pdf";
  return "other";
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function BadgeForm({ initialData, onSave, onClose, initialCustomOrgs = [], initialCustomDomains = [] }: Props) {
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    issuingOrganization: initialData?.issuingOrganization ?? "",
    description: initialData?.description ?? "",
    issuedAt: toInputDate(initialData?.issuedAt),
    expiresAt: toInputDate(initialData?.expiresAt),
    noExpiry: !initialData?.expiresAt,
    credentialId: initialData?.credentialId ?? "",
    credentialUrl: initialData?.credentialUrl ?? "",
    domain: initialData?.domain ?? "",
  });

  const [customOrgs, setCustomOrgs] = useState<CustomOrg[]>(initialCustomOrgs);
  const [customDomains, setCustomDomains] = useState<CustomDomain[]>(initialCustomDomains);
  const [importPlatform, setImportPlatform] = useState<"credly" | "leetcode">("credly");

  const [credlyUrl, setCredlyUrl] = useState("");
  const [credlyLoading, setCredlyLoading] = useState(false);
  const [credlyNotice, setCredlyNotice] = useState<{ type: "success" | "warn"; message: string } | null>(null);

  const [leetcodeInput, setLeetcodeInput] = useState("");
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeNotice, setLeetcodeNotice] = useState<{ type: "success" | "warn"; message: string } | null>(null);
  const [leetcodeBadges, setLeetcodeBadges] = useState<LeetCodeBadge[] | null>(null);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importingLeetcode, setImportingLeetcode] = useState(false);

  const [filePreview, setFilePreview] = useState<string | null>(
    initialData?.imageUrl ?? null
  );
  const [fileCategory, setFileCategory] = useState<"image" | "svg" | "pdf" | "other" | null>(() => {
    const url = initialData?.imageUrl;
    if (!url) return null;
    if (url.toLowerCase().endsWith(".pdf")) return "pdf";
    if (url.toLowerCase().endsWith(".svg")) return "svg";
    return "image";
  });
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(initialData?.imageUrl ?? null);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [wasCropped, setWasCropped] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credUrlError, setCredUrlError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Load custom domains if none provided
  useEffect(() => {
    if (initialCustomDomains.length === 0) {
      fetch("/api/domains")
        .then((r) => r.json())
        .then((j) => { if (j.data) setCustomDomains(j.data); })
        .catch(() => {});
    }
  }, [initialCustomDomains.length]);

  const handleField = (field: keyof typeof form, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  };

  const handleCredlyImport = async () => {
    if (!credlyUrl.trim()) return;
    setCredlyLoading(true);
    setCredlyNotice(null);
    try {
      const res = await fetch("/api/badges/credly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: credlyUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCredlyNotice({ type: "warn", message: "Could not import from this URL. Please fill in the details manually." });
        return;
      }
      const d = json.data;
      setForm((prev) => ({
        ...prev,
        title: d.title || prev.title,
        issuingOrganization: d.issuingOrganization || prev.issuingOrganization,
        description: d.description || prev.description,
        issuedAt: d.issuedAt || prev.issuedAt,
        expiresAt: d.expiresAt || prev.expiresAt,
        noExpiry: !d.expiresAt && !prev.expiresAt,
        credentialId: d.credentialId || prev.credentialId,
        credentialUrl: d.credentialUrl || prev.credentialUrl,
      }));
      if (d.imageBase64 && !pendingFile) {
        try {
          const res2 = await fetch(d.imageBase64);
          const blob = await res2.blob();
          const imgFile = new File([blob], "credly-badge.png", { type: blob.type || "image/png" });
          setProcessing(true);
          setProcessingMsg("Optimising badge image…");
          try {
            const cropResult = await smartCropBadge(imgFile);
            const compressed = await compressImage(cropResult.croppedFile);
            setPendingFile(compressed);
            setFilePreview(URL.createObjectURL(compressed));
          } catch {
            setPendingFile(imgFile);
            setFilePreview(URL.createObjectURL(imgFile));
          } finally {
            setProcessing(false);
            setProcessingMsg("");
          }
          setExistingFileUrl(null);
          setFileCategory("image");
        } catch {
          // fallback: store URL only
          if (d.imageUrl) {
            setFilePreview(d.imageUrl);
            setExistingFileUrl(d.imageUrl);
            setFileCategory("image");
          }
        }
      } else if (d.imageUrl && !existingFileUrl && !pendingFile) {
        setFilePreview(d.imageUrl);
        setExistingFileUrl(d.imageUrl);
        setFileCategory("image");
      }
      const dateNotice = d.issuedAt ? "" : " Issue date was not available — please fill it in manually.";
      setCredlyNotice({ type: "success", message: `Badge details imported from Credly.${dateNotice}` });
    } catch {
      setCredlyNotice({ type: "warn", message: "Could not import from this URL. Please fill in the details manually." });
    } finally {
      setCredlyLoading(false);
    }
  };

  const handleLeetcodeFetch = async () => {
    if (!leetcodeInput.trim()) return;
    setLeetcodeLoading(true);
    setLeetcodeNotice(null);
    try {
      const res = await fetch("/api/badges/leetcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: leetcodeInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLeetcodeNotice({ type: "warn", message: json.error || "Could not reach LeetCode. Please try again." });
        return;
      }
      setLeetcodeBadges(json.badges);
      setLeetcodeUsername(json.username);
      setSelectedIds(new Set((json.badges as LeetCodeBadge[]).map((b) => b.originalId)));
    } catch {
      setLeetcodeNotice({ type: "warn", message: "Could not reach LeetCode. Please try again." });
    } finally {
      setLeetcodeLoading(false);
    }
  };

  const handleLeetcodeImport = async () => {
    if (selectedIds.size === 0 || !leetcodeBadges) return;
    setImportingLeetcode(true);
    setLeetcodeNotice(null);
    const toImport = leetcodeBadges.filter((b) => selectedIds.has(b.originalId));
    try {
      const res = await fetch("/api/badges/leetcode/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badges: toImport }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLeetcodeNotice({ type: "warn", message: json.error || "Import failed. Please try again." });
        return;
      }
      for (const badge of (json.data ?? [])) {
        onSave(badge);
      }
      if (json.imported === 0) {
        setLeetcodeNotice({ type: "warn", message: "All selected badges already exist in your profile." });
        return;
      }
      if (json.skipped > 0) {
        setLeetcodeNotice({
          type: "success",
          message: `${json.imported} badge${json.imported !== 1 ? "s" : ""} imported. ${json.skipped} skipped (already exist).`,
        });
        setTimeout(() => onClose(), 2000);
      } else {
        onClose();
      }
    } catch {
      setLeetcodeNotice({ type: "warn", message: "Import failed. Please try again." });
    } finally {
      setImportingLeetcode(false);
    }
  };

  const toggleBadge = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!leetcodeBadges) return;
    if (selectedIds.size === leetcodeBadges.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leetcodeBadges.map((b) => b.originalId)));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("File must be 5MB or smaller.");
      return;
    }

    setError(null);
    setWasCropped(false);
    const category = getFileCategory(file);
    setFileCategory(category);

    if (category === "image") {
      setProcessing(true);
      setProcessingMsg("Detecting badge area…");
      try {
        const cropResult = await smartCropBadge(file);
        let fileToProcess = cropResult.croppedFile;
        if (cropResult.wasCropped) {
          setWasCropped(true);
          setProcessingMsg("Optimising image…");
        }
        fileToProcess = await compressImage(fileToProcess);
        setPendingFile(fileToProcess);
        setFilePreview(URL.createObjectURL(fileToProcess));
        setExistingFileUrl(null);
      } catch {
        // Silent fallback
        setPendingFile(file);
        setFilePreview(URL.createObjectURL(file));
        setExistingFileUrl(null);
      } finally {
        setProcessing(false);
        setProcessingMsg("");
      }
    } else if (category === "svg") {
      setPendingFile(file);
      setFilePreview(URL.createObjectURL(file));
      setExistingFileUrl(null);
    } else if (category === "pdf") {
      setPendingFile(file);
      setFilePreview(null);
      setExistingFileUrl(null);
    } else {
      setPendingFile(file);
      setFilePreview(null);
      setExistingFileUrl(null);
    }
  };

  const clearFile = () => {
    setPendingFile(null);
    setFilePreview(null);
    setExistingFileUrl(null);
    setFileCategory(null);
    setWasCropped(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validateCredUrl = (url: string) => {
    if (!url) return null;
    try {
      new URL(url);
      return null;
    } catch {
      return "Please enter a valid URL.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.title || !form.issuingOrganization || !form.issuedAt || !form.domain) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!hasFile) {
      setError("Please upload a badge image.");
      return;
    }

    const credUrlErr = validateCredUrl(form.credentialUrl);
    if (credUrlErr) { setCredUrlError(credUrlErr); return; }

    const effectiveDomain = form.domain || null;

    setLoading(true);
    try {
      let imageUrl = existingFileUrl ?? "";

      if (isEdit) {
        const payload = {
          title: form.title,
          issuingOrganization: form.issuingOrganization,
          description: form.description || null,
          issuedAt: form.issuedAt,
          expiresAt: form.noExpiry ? null : form.expiresAt || null,
          credentialId: form.credentialId || null,
          credentialUrl: form.credentialUrl || null,
          imageUrl: imageUrl || null,
          domain: effectiveDomain,
        };

        const res = await fetch(`/api/badges/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Save failed."); setLoading(false); return; }

        if (pendingFile) {
          imageUrl = await uploadBadgeImage(pendingFile, json.data.userId, json.data.id);
          const patchRes = await fetch(`/api/badges/${initialData!.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl }),
          });
          const patchJson = await patchRes.json();
          onSave(patchJson.data);
        } else {
          onSave(json.data);
        }
      } else {
        const res = await fetch("/api/badges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            issuingOrganization: form.issuingOrganization,
            description: form.description || null,
            issuedAt: form.issuedAt,
            expiresAt: form.noExpiry ? null : form.expiresAt || null,
            credentialId: form.credentialId || null,
            credentialUrl: form.credentialUrl || null,
            imageUrl: (!pendingFile && existingFileUrl) ? existingFileUrl : null,
            domain: effectiveDomain,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Failed to create badge."); setLoading(false); return; }

        if (pendingFile) {
          imageUrl = await uploadBadgeImage(pendingFile, json.data.userId, json.data.id);
          const patchRes = await fetch(`/api/badges/${json.data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl }),
          });
          const patchJson = await patchRes.json();
          onSave(patchJson.data);
        } else {
          onSave(json.data);
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasFile = !!pendingFile || !!existingFileUrl;
  const isDisabled = loading || processing;
  const canSave = form.title && form.issuingOrganization && form.issuedAt && form.domain && hasFile && !isDisabled;

  const orgInitials = (form.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // LeetCode badge picker view
  if (leetcodeBadges) {
    const allSelected = selectedIds.size === leetcodeBadges.length;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div
          className="relative w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
          style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Import LeetCode badges</h2>
            <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-slate-400 hover:text-slate-800 hover:bg-black/[0.06] dark:text-white/40 dark:hover:text-white dark:hover:bg-white/[0.08]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Found count */}
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Found {leetcodeBadges.length} badge{leetcodeBadges.length !== 1 ? "s" : ""} on{" "}
              <span className="text-violet-600 dark:text-violet-400">@{leetcodeUsername}</span>&apos;s LeetCode profile
            </p>

            {/* Select all + count */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              <span className="text-xs text-slate-400 dark:text-white/40">
                {selectedIds.size} of {leetcodeBadges.length} selected
              </span>
            </div>

            {/* Scrollable badge grid */}
            <div className="overflow-y-auto rounded-xl" style={{ maxHeight: 280, border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 gap-px" style={{ background: "var(--border)" }}>
                {leetcodeBadges.map((badge) => {
                  const selected = selectedIds.has(badge.originalId);
                  return (
                    <button
                      key={badge.originalId}
                      type="button"
                      onClick={() => toggleBadge(badge.originalId)}
                      className="flex items-center gap-3 px-4 py-3 text-left transition-all"
                      style={{
                        background: selected ? "rgba(124,58,237,0.07)" : "var(--surface)",
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: selected ? "#7c3aed" : "transparent",
                          border: selected ? "1px solid #7c3aed" : "1px solid var(--border-hover)",
                        }}
                      >
                        {selected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </div>

                      {/* Icon */}
                      {badge.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={badge.imageUrl} alt={badge.title} className="w-9 h-9 object-contain shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          LC
                        </div>
                      )}

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{badge.title}</p>
                        <p className="text-[11px] text-slate-400 dark:text-white/35">
                          {badge.issuedAt ?? "Date unknown"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notice */}
            {leetcodeNotice && (
              <p className={`text-xs px-3 py-2 rounded-lg ${leetcodeNotice.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                {leetcodeNotice.message}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleLeetcodeImport}
                disabled={selectedIds.size === 0 || importingLeetcode}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: selectedIds.size > 0 && !importingLeetcode ? "0 4px 20px rgba(124,58,237,0.35)" : undefined,
                }}
              >
                {importingLeetcode && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {importingLeetcode
                  ? "Importing… this may take a moment"
                  : `Import ${selectedIds.size > 0 ? `${selectedIds.size} ` : ""}selected badge${selectedIds.size !== 1 ? "s" : ""}`}
              </button>
              <button
                type="button"
                onClick={() => { setLeetcodeBadges(null); setLeetcodeNotice(null); setSelectedIds(new Set()); }}
                className="px-5 py-3 rounded-xl text-sm font-semibold transition-all text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08] dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl flex flex-col"
        style={{ background: "var(--surface)", border: "1px solid var(--border-hover)", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isEdit ? "Edit badge" : "Add badge"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all text-slate-400 hover:text-slate-800 hover:bg-black/[0.06] dark:text-white/40 dark:hover:text-white dark:hover:bg-white/[0.08]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">

          {/* Import section */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
            {/* Platform toggle */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-white/50">Import from</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setImportPlatform("credly"); setLeetcodeNotice(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={importPlatform === "credly"
                    ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" }
                    : { background: "transparent", color: "var(--foreground)", border: "1px solid var(--border-hover)", opacity: 0.7 }}
                >
                  Credly
                </button>
                <button
                  type="button"
                  onClick={() => { setImportPlatform("leetcode"); setCredlyNotice(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={importPlatform === "leetcode"
                    ? { background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff", boxShadow: "0 2px 8px rgba(124,58,237,0.3)" }
                    : { background: "transparent", color: "var(--foreground)", border: "1px solid var(--border-hover)", opacity: 0.7 }}
                >
                  LeetCode
                </button>
              </div>
            </div>

            {/* Credly input */}
            {importPlatform === "credly" && (
              <>
                <p className="text-xs text-slate-500 dark:text-white/50">Paste your Credly badge URL to auto-fill the form</p>
                <div className="flex gap-2">
                  <input
                    value={credlyUrl}
                    onChange={(e) => setCredlyUrl(e.target.value)}
                    placeholder="https://www.credly.com/badges/…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all
                      bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                      text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                      focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleCredlyImport}
                    disabled={credlyLoading || !credlyUrl.trim()}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    {credlyLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : "Import"}
                  </button>
                </div>
                {credlyNotice && (
                  <p className={`text-xs px-3 py-2 rounded-lg ${credlyNotice.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                    {credlyNotice.message}
                  </p>
                )}
              </>
            )}

            {/* LeetCode input */}
            {importPlatform === "leetcode" && (
              <>
                <p className="text-xs text-slate-500 dark:text-white/50">Enter your LeetCode username or profile URL to fetch your badges</p>
                <div className="flex gap-2">
                  <input
                    value={leetcodeInput}
                    onChange={(e) => setLeetcodeInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLeetcodeFetch(); } }}
                    placeholder="Username or https://leetcode.com/u/…"
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none transition-all
                      bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                      text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                      focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleLeetcodeFetch}
                    disabled={leetcodeLoading || !leetcodeInput.trim()}
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  >
                    {leetcodeLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : "Fetch badges"}
                  </button>
                </div>
                {leetcodeNotice && (
                  <p className={`text-xs px-3 py-2 rounded-lg ${leetcodeNotice.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"}`}>
                    {leetcodeNotice.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs text-slate-400 dark:text-white/35 shrink-0">or fill in manually</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">
              Badge image <span className="text-red-500">*</span>
            </label>

            {processing ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl"
                style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <svg className="w-5 h-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-violet-600 dark:text-violet-400">{processingMsg}</p>
              </div>
            ) : hasFile ? (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {(fileCategory === "image" || fileCategory === "svg") && filePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filePreview}
                    alt="Badge preview"
                    className="w-full h-32 sm:h-40 object-contain bg-slate-50 dark:bg-white/5"
                  />
                )}
                {fileCategory === "pdf" && (
                  <div className="h-24 flex items-center justify-center gap-3 bg-red-500/10">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-white/60 truncate">{pendingFile?.name ?? "PDF"}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-3" style={{ background: "var(--hover-bg)" }}>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={isDisabled}
                    className="flex-1 text-xs font-medium rounded-lg py-1.5 transition-all
                      text-slate-500 hover:text-slate-800 bg-black/[0.04] hover:bg-black/[0.07] border border-black/[0.06]
                      dark:text-white/65 dark:hover:text-white dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Replace file
                  </button>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={isDisabled}
                    className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300
                      bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg py-1.5 px-3 transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
                {wasCropped && (
                  <p className="text-[11px] text-slate-400 dark:text-white/35 px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
                    Badge area auto-detected and cropped. If this looks wrong, replace the image.
                  </p>
                )}
              </div>
            ) : (
              <label
                htmlFor="badge-file"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all
                  bg-black/[0.03] dark:bg-white/[0.04] border-2 border-dashed border-black/[0.10] dark:border-white/[0.12]
                  hover:border-violet-500/40 hover:bg-violet-500/[0.03]"
              >
                <svg className="w-8 h-8 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-xs text-slate-400 dark:text-white/40 text-center">
                  Click to upload<br />
                  <span className="text-[11px] text-slate-300 dark:text-white/25">Max 5MB</span>
                </p>
              </label>
            )}
            <input
              ref={fileRef}
              id="badge-file"
              type="file"
              accept="*/*"
              className="sr-only"
              onChange={handleFileSelect}
            />
          </div>

          {/* Badge title */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">
              Badge title <span className="text-red-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => handleField("title", e.target.value)}
              placeholder="e.g. AWS Certified Solutions Architect"
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* Issuing organization */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">
              Issuing organization <span className="text-red-500">*</span>
            </label>
            <OrganizationDropdown
              value={form.issuingOrganization}
              onChange={(val) => handleField("issuingOrganization", val)}
              customOrgs={customOrgs}
              onCustomOrgsChange={setCustomOrgs}
              error={!form.issuingOrganization && !!error ? "Required" : undefined}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => {
                if (e.target.value.length <= 1000) handleField("description", e.target.value);
              }}
              placeholder="What did you earn this badge for?"
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none
                bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
            <p className="text-[11px] text-slate-400 dark:text-white/30 mt-1 text-right">
              {form.description.length}/1000
            </p>
          </div>

          {/* Issue date */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">
              Issue date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.issuedAt}
              onChange={(e) => handleField("issuedAt", e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                text-slate-800 dark:text-white
                focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* Expiration date */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Expiration date</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="badge-no-expiry"
                checked={form.noExpiry}
                onChange={(e) => handleField("noExpiry", e.target.checked)}
                className="w-4 h-4 rounded accent-violet-600"
              />
              <label htmlFor="badge-no-expiry" className="text-sm text-slate-600 dark:text-white/60 cursor-pointer">No expiry</label>
            </div>
            {!form.noExpiry && (
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => handleField("expiresAt", e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                  bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                  text-slate-800 dark:text-white
                  focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              />
            )}
          </div>

          {/* Credential ID */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Credential ID</label>
            <input
              value={form.credentialId}
              onChange={(e) => handleField("credentialId", e.target.value)}
              placeholder="Badge ID or license number"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            />
          </div>

          {/* Credential URL */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Credential URL</label>
            <input
              type="url"
              value={form.credentialUrl}
              onChange={(e) => { handleField("credentialUrl", e.target.value); setCredUrlError(null); }}
              placeholder="https://www.credly.com/badges/..."
              className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                bg-black/[0.04] dark:bg-white/[0.06] border text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                focus:ring-1 focus:ring-violet-500/20
                ${credUrlError ? "border-red-500/40 focus:border-red-500/60" : "border-black/[0.08] dark:border-white/[0.11] focus:border-violet-500/40"}`}
            />
            {credUrlError && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{credUrlError}</p>}
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">
              Domain <span className="text-red-500">*</span>
            </label>
            <DomainDropdown
              value={form.domain}
              onChange={(val) => handleField("domain", val)}
              customDomains={customDomains}
              onCustomDomainsChange={setCustomDomains}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={!canSave}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: canSave ? "0 4px 20px rgba(124,58,237,0.35)" : undefined }}
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : null}
              {loading ? "Saving…" : isEdit ? "Save changes" : "Add badge"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all
                text-slate-500 bg-black/[0.04] border border-black/[0.06] hover:bg-black/[0.08]
                dark:text-white/55 dark:bg-white/[0.05] dark:border-white/[0.09] dark:hover:bg-white/[0.10]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
