"use client";

import { useEffect, useRef, useState } from "react";
import type { Badge } from "@prisma/client";
import { DOMAINS } from "@/lib/constants";
import { compressImage } from "@/lib/compressImage";
import { smartCropBadge } from "@/lib/smartCrop";
import { uploadBadgeImage } from "@/lib/utils/storage";
import OrganizationDropdown from "@/components/OrganizationDropdown";

interface CustomOrg {
  id: string;
  name: string;
}

interface Props {
  initialData: Badge | null;
  onSave: (badge: Badge) => void;
  onClose: () => void;
  initialCustomOrgs?: CustomOrg[];
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

export default function BadgeForm({ initialData, onSave, onClose, initialCustomOrgs = [] }: Props) {
  const isEdit = !!initialData;

  const domainValues = DOMAINS.map((d) => d.value as string);
  const isCustomDomain = initialData?.domain ? !domainValues.includes(initialData.domain) && initialData.domain !== null : false;

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    issuingOrganization: initialData?.issuingOrganization ?? "",
    description: initialData?.description ?? "",
    issuedAt: toInputDate(initialData?.issuedAt),
    expiresAt: toInputDate(initialData?.expiresAt),
    noExpiry: !initialData?.expiresAt,
    credentialId: initialData?.credentialId ?? "",
    credentialUrl: initialData?.credentialUrl ?? "",
    domain: isCustomDomain ? "Other" : (initialData?.domain ?? ""),
    customDomain: isCustomDomain ? (initialData?.domain ?? "") : "",
  });

  const [customOrgs, setCustomOrgs] = useState<CustomOrg[]>(initialCustomOrgs);
  const [credlyUrl, setCredlyUrl] = useState("");
  const [credlyLoading, setCredlyLoading] = useState(false);
  const [credlyNotice, setCredlyNotice] = useState<{ type: "success" | "warn"; message: string } | null>(null);

  const [filePreview, setFilePreview] = useState<string | null>(
    initialData?.imageUrl ?? null
  );
  const [fileCategory, setFileCategory] = useState<"image" | "svg" | "pdf" | "other" | null>(null);
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

    if (!form.title || !form.issuingOrganization || !form.issuedAt) {
      setError("Please fill in all required fields.");
      return;
    }

    const credUrlErr = validateCredUrl(form.credentialUrl);
    if (credUrlErr) { setCredUrlError(credUrlErr); return; }

    const effectiveDomain =
      form.domain === "Other" && form.customDomain.trim()
        ? form.customDomain.trim()
        : form.domain || null;

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
  const canSave = form.title && form.issuingOrganization && form.issuedAt && !isDisabled;

  const orgInitials = (form.issuingOrganization || "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

          {/* Credly import */}
          <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div>
              <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">Import from Credly</p>
              <p className="text-xs mt-0.5 text-slate-500 dark:text-white/50">Paste your Credly badge URL to auto-fill the form</p>
            </div>
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
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs text-slate-400 dark:text-white/35 shrink-0">or fill in manually</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Badge image</label>

            {!hasFile && !processing ? (
              <label
                htmlFor="badge-file"
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl cursor-pointer transition-all
                  bg-black/[0.03] dark:bg-white/[0.04] border-2 border-dashed border-black/[0.10] dark:border-white/[0.12]
                  hover:border-violet-500/40 hover:bg-violet-500/[0.03]"
              >
                <svg className="w-8 h-8 text-slate-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
                </svg>
                <p className="text-xs text-slate-400 dark:text-white/40 text-center">
                  Click to upload any file<br />
                  <span className="text-[11px] text-slate-300 dark:text-white/25">Max 5MB</span>
                </p>
                <input
                  ref={fileRef}
                  id="badge-file"
                  type="file"
                  accept="*/*"
                  className="sr-only"
                  onChange={handleFileSelect}
                />
              </label>
            ) : processing ? (
              <div className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl"
                style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <svg className="w-5 h-5 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-xs text-violet-600 dark:text-violet-400">{processingMsg}</p>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                {fileCategory === "image" || fileCategory === "svg" ? (
                  filePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={filePreview}
                      alt="Badge preview"
                      className="w-full max-h-48 object-contain bg-slate-50 dark:bg-white/5"
                    />
                  ) : null
                ) : fileCategory === "pdf" ? (
                  <div className="flex items-center gap-3 p-4">
                    <svg className="w-8 h-8 text-red-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-white/60 truncate">{pendingFile?.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-4">
                    <svg className="w-8 h-8 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                    <span className="text-sm text-slate-600 dark:text-white/60 truncate">{pendingFile?.name || existingFileUrl}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
                  title="Remove file"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {wasCropped && (
                  <p className="text-[11px] text-slate-400 dark:text-white/35 px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
                    Badge area auto-detected and cropped. If this looks wrong, upload your image again.
                  </p>
                )}
              </div>
            )}
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
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-white/70 uppercase tracking-wider">Domain</label>
            <select
              value={form.domain}
              onChange={(e) => handleField("domain", e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all cursor-pointer
                bg-white dark:bg-[#111425] border border-black/[0.08] dark:border-white/[0.11]
                text-slate-800 dark:text-white/75
                focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
            >
              <option value="">No domain</option>
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {form.domain === "Other" && (
              <input
                value={form.customDomain}
                onChange={(e) => handleField("customDomain", e.target.value)}
                placeholder="Enter custom domain"
                className="w-full mt-2 rounded-xl px-4 py-3 text-sm outline-none transition-all
                  bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.11]
                  text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/35
                  focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              />
            )}
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
