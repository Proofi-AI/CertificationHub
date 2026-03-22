"use client";

import { useEffect, useRef, useState } from "react";
import type { Certificate } from "@prisma/client";
import { DOMAINS, MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES, ACCEPTED_FILE_ACCEPT } from "@/lib/constants";
import { uploadCertificateImage } from "@/lib/utils/storage";

interface Props {
  initialData: Certificate | null;
  onSave: (cert: Certificate) => void;
  onClose: () => void;
}

const toInputDate = (date: Date | string | null | undefined): string => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

export default function CertificateFormModal({ initialData, onSave, onClose }: Props) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    issuer: initialData?.issuer ?? "",
    issuedAt: toInputDate(initialData?.issuedAt),
    expiresAt: toInputDate(initialData?.expiresAt),
    noExpiry: !initialData?.expiresAt,
    domain: initialData?.domain ?? DOMAINS[0].value,
    customDomain: "",
    credentialId: initialData?.credentialId ?? "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl && !initialData.imageUrl.endsWith(".pdf") ? initialData.imageUrl : null
  );
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(initialData?.imageUrl ?? null);
  const [isPdf, setIsPdf] = useState(
    initialData?.imageUrl?.endsWith(".pdf") ?? false
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleField = (field: keyof typeof form, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WebP, or PDF files are accepted.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File must be 5MB or smaller.");
      return;
    }
    setImageFile(file);
    setError(null);
    if (file.type === "application/pdf") {
      setImagePreview(null);
      setIsPdf(true);
    } else {
      setImagePreview(URL.createObjectURL(file));
      setIsPdf(false);
    }
  };

  const clearFile = () => {
    setImageFile(null);
    setImagePreview(null);
    setIsPdf(false);
    setExistingFileUrl(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const hasFile = !!imageFile || !!existingFileUrl;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.issuer || !form.issuedAt || !form.domain) {
      setError("Please fill in all required fields.");
      return;
    }

    // Image is mandatory
    if (!hasFile) {
      setError("Please upload a certificate image or PDF.");
      return;
    }

    const effectiveDomain =
      form.domain === "Other" && form.customDomain.trim()
        ? form.customDomain.trim()
        : form.domain;

    setLoading(true);

    try {
      let imageUrl = existingFileUrl ?? "";

      if (isEdit) {
        // For edits: update the record first, then upload new file if selected
        const payload = {
          name: form.name,
          issuer: form.issuer,
          issuedAt: form.issuedAt,
          expiresAt: form.noExpiry ? null : form.expiresAt || null,
          domain: effectiveDomain,
          credentialId: form.credentialId || null,
          imageUrl,
        };

        const res = await fetch(`/api/certificates/${initialData!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Save failed."); setLoading(false); return; }

        // Upload new file if selected
        if (imageFile) {
          imageUrl = await uploadCertificateImage(imageFile, json.data.userId, json.data.id);
          const patchRes = await fetch(`/api/certificates/${initialData!.id}`, {
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
        // For creates: create record first to get the id, then upload
        const res = await fetch("/api/certificates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            issuer: form.issuer,
            issuedAt: form.issuedAt,
            expiresAt: form.noExpiry ? null : form.expiresAt || null,
            domain: effectiveDomain,
            credentialId: form.credentialId || null,
            imageUrl: null,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Failed to create certificate."); setLoading(false); return; }

        // Upload the file using the real certId
        imageUrl = await uploadCertificateImage(imageFile!, json.data.userId, json.data.id);

        // Update the certificate with the imageUrl
        const patchRes = await fetch(`/api/certificates/${json.data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
        const patchJson = await patchRes.json();
        onSave(patchJson.data);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg glass border border-white/15 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#0a0a0f]/80 backdrop-blur-md z-10">
          <h2 className="font-semibold text-base">{isEdit ? "Edit certificate" : "Add certificate"}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Certificate name */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Certificate name <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              placeholder="AWS Solutions Architect"
              required
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
            />
          </div>

          {/* Issuer */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Issuer / Company <span className="text-red-400">*</span>
            </label>
            <input
              value={form.issuer}
              onChange={(e) => handleField("issuer", e.target.value)}
              placeholder="Amazon Web Services"
              required
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Date issued <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={form.issuedAt}
                onChange={(e) => handleField("issuedAt", e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-white/50">Expiry date</label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.noExpiry}
                    onChange={(e) => handleField("noExpiry", e.target.checked)}
                    className="w-3 h-3 accent-violet-500"
                  />
                  <span className="text-xs text-white/40">No expiry</span>
                </label>
              </div>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => handleField("expiresAt", e.target.value)}
                disabled={form.noExpiry}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Domain */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Domain <span className="text-red-400">*</span>
            </label>
            <select
              value={form.domain}
              onChange={(e) => handleField("domain", e.target.value)}
              required
              className="w-full bg-[#1a1a2e] border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all"
            >
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            {form.domain === "Other" && (
              <input
                value={form.customDomain}
                onChange={(e) => handleField("customDomain", e.target.value)}
                placeholder="Specify your domain…"
                className="mt-2 w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
              />
            )}
          </div>

          {/* File upload — mandatory */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Certificate file <span className="text-red-400">*</span>
              <span className="text-white/25 ml-1">(Image or PDF, max 5MB)</span>
            </label>

            {hasFile ? (
              <div className="relative rounded-xl border border-white/10 overflow-hidden">
                {/* Image preview */}
                {imagePreview && (
                  <div className="h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* PDF indicator */}
                {isPdf && (
                  <div className="h-24 flex items-center justify-center gap-3 bg-red-500/10">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-300">PDF selected</p>
                      <p className="text-xs text-white/40">{imageFile?.name ?? "Existing PDF"}</p>
                    </div>
                  </div>
                )}
                {/* Existing image from URL (no local file) */}
                {!imagePreview && !isPdf && existingFileUrl && (
                  <div className="h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={existingFileUrl} alt="Current" className="w-full h-full object-cover" />
                  </div>
                )}
                {/* Actions bar */}
                <div className="flex items-center gap-2 p-3 bg-black/20">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1.5 transition-all"
                  >
                    Replace file
                  </button>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-lg py-1.5 px-3 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-28 border-2 border-dashed border-white/15 hover:border-violet-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <div className="text-center">
                  <p className="text-xs font-medium">Click to upload</p>
                  <p className="text-xs text-white/20 mt-0.5">JPG, PNG, WebP, or PDF</p>
                </div>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED_FILE_ACCEPT}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Credential ID */}
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Credential ID <span className="text-white/25">(optional)</span>
            </label>
            <input
              value={form.credentialId}
              onChange={(e) => handleField("credentialId", e.target.value)}
              placeholder="e.g. AWS-SAA-C03-1234567"
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {imageFile && !isEdit ? "Uploading & saving…" : "Saving…"}
                </span>
              ) : (
                isEdit ? "Save changes" : "Add certificate"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
