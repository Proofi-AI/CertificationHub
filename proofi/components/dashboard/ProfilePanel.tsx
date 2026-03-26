"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { User } from "@prisma/client";
import { uploadAvatar } from "@/lib/utils/storage";
import { SLUG_REGEX } from "@/lib/constants";

/* ── Preset avatars (DiceBear fun-emoji, free CDN) ── */
const PRESETS = [
  { seed: "Zara",    bg: "b6e3f4" },
  { seed: "Felix",   bg: "c0aede" },
  { seed: "Luna",    bg: "ffd5dc" },
  { seed: "Max",     bg: "d1fae5" },
  { seed: "Nova",    bg: "ffdfbf" },
  { seed: "Kai",     bg: "dbeafe" },
  { seed: "Aria",    bg: "fce7f3" },
  { seed: "Leo",     bg: "ede9fe" },
  { seed: "Sam",     bg: "dcfce7" },
  { seed: "Alex",    bg: "fef3c7" },
];
const dicebearUrl = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&backgroundColor=${bg}`;

/* ── Banner gradients — one per preset bg ── */
const BANNER_GRADIENTS: Record<string, string> = {
  b6e3f4: "linear-gradient(135deg, #0e7490 0%, #0284c7 50%, #38bdf8 100%)",
  c0aede: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c4b5fd 100%)",
  ffd5dc: "linear-gradient(135deg, #881337 0%, #e11d48 50%, #fb7185 100%)",
  d1fae5: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #6ee7b7 100%)",
  ffdfbf: "linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)",
  dbeafe: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #93c5fd 100%)",
  fce7f3: "linear-gradient(135deg, #831843 0%, #db2777 50%, #f9a8d4 100%)",
  ede9fe: "linear-gradient(135deg, #3b0764 0%, #7c3aed 50%, #ddd6fe 100%)",
  dcfce7: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #86efac 100%)",
  fef3c7: "linear-gradient(135deg, #78350f 0%, #b45309 50%, #fde68a 100%)",
};
const DEFAULT_BANNER = "linear-gradient(135deg, #4c1d95 0%, #4338ca 50%, #0e7490 100%)";
const getBannerGradient = (bg: string | null) => (bg && BANNER_GRADIENTS[bg]) ?? DEFAULT_BANNER;

function extractPresetBg(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).searchParams.get("backgroundColor");
  } catch {
    return null;
  }
}

interface Props {
  initialProfile: User;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function ProfilePanel({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [name, setName] = useState(initialProfile.name ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [slug, setSlug] = useState(initialProfile.slug);
  const [defaultTheme, setDefaultTheme] = useState<"dark" | "light">(
    (initialProfile.defaultTheme as "dark" | "light") ?? "dark"
  );
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Avatar picker modal
  const [pickerOpen, setPickerOpen]       = useState(false);
  const [pickerTab, setPickerTab]         = useState<"presets" | "upload">("presets");
  const [pendingUrl, setPendingUrl]       = useState<string | null>(null);
  const [pendingBg, setPendingBg]         = useState<string | null>(null);
  const [bannerBg, setBannerBg]           = useState<string | null>(() => extractPresetBg(initialProfile.avatarUrl));
  const [dragOver, setDragOver]           = useState(false);
  const [uploadError, setUploadError]     = useState<string | null>(null);

  const fileRef   = useRef<HTMLInputElement>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset picker state when opened
  useEffect(() => {
    if (pickerOpen) { setPendingUrl(null); setPendingBg(null); setUploadError(null); setPickerTab("presets"); }
  }, [pickerOpen]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${appUrl}/${profile.slug}`;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: url }) });
      setProfile((p) => ({ ...p, avatarUrl: url }));
    } catch {
      setSaveMsg({ type: "error", text: "Avatar upload failed. Try again." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const checkSlug = useCallback(async (value: string) => {
    if (value === initialProfile.slug) { setSlugStatus("idle"); return; }
    if (!SLUG_REGEX.test(value)) { setSlugStatus("invalid"); return; }
    setSlugStatus("checking");
    const res = await fetch(`/api/profile/check-slug?slug=${encodeURIComponent(value)}`);
    const json = await res.json();
    setSlugStatus(json.available ? "available" : "taken");
  }, [initialProfile.slug]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlug(val);
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(() => checkSlug(val), 400);
  };

  const handleSave = async () => {
    if (slugStatus === "taken" || slugStatus === "invalid") return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bio, slug, defaultTheme }) });
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        setSaveMsg({ type: "error", text: json.error || "Save failed." });
      } else {
        setProfile(json.data);
        setSaveMsg({ type: "success", text: "Profile saved successfully!" });
        setTimeout(() => setSaveMsg(null), 3500);
      }
    } catch {
      setSaveMsg({ type: "error", text: "Something went wrong. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const applyAvatar = async (url: string, bg?: string | null) => {
    setAvatarUploading(true);
    try {
      await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: url }) });
      setProfile((p) => ({ ...p, avatarUrl: url }));
      setBannerBg(bg ?? null);
      setPickerOpen(false);
    } catch {
      setUploadError("Failed to save avatar. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Only JPG, PNG, or WebP files are supported."); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5MB."); return;
    }
    setUploadError(null);
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: url }) });
      setProfile((p) => ({ ...p, avatarUrl: url }));
      setBannerBg(null);
      setPickerOpen(false);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = (profile.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const saveDisabled = slugStatus === "taken" || slugStatus === "invalid" || bio.length > 160 || saving;

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-black/[0.04] border border-black/[0.09] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-slate-800 placeholder-slate-400 dark:bg-white/[0.06] dark:border-white/[0.12] dark:text-white dark:placeholder-white/35";

  return (
    <div className="space-y-5">

      {/* ── Identity card ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Top gradient banner */}
        <div
          className="h-20 w-full relative"
          style={{
            background: getBannerGradient(pickerOpen && pendingBg ? pendingBg : bannerBg),
            transition: "background 0.35s ease",
          }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
          <div className="absolute left-16 bottom-0 w-16 h-16 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #fff, transparent)" }} />
        </div>

        {/* Avatar overlapping the banner */}
        <div className="px-6 pb-5" style={{ background: "var(--surface)" }}>
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar with edit overlay */}
            <div className="relative group cursor-pointer shrink-0" onClick={() => setPickerOpen(true)}>
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden ring-4"
                style={{ ringColor: "var(--surface)", boxShadow: "0 0 0 4px var(--surface), 0 0 0 6px rgba(124,58,237,0.4)" }}
              >
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                    {initials}
                  </div>
                )}
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              {/* Loading spinner */}
              {avatarUploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Change avatar button */}
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border
                text-violet-600 border-violet-500/30 bg-violet-500/8 hover:bg-violet-500/16
                dark:text-violet-400 dark:border-violet-400/25 dark:bg-violet-400/8 dark:hover:bg-violet-400/14"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              Change avatar
            </button>
          </div>

          <div>
            <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              {profile.name || "Your name"}
            </p>
            <p className="text-xs text-slate-400 dark:text-white/40 mt-0.5">proofi.ai/{profile.slug}</p>
          </div>
        </div>
      </div>

      {/* Hidden file input for custom upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
      />

      {/* ── Avatar picker modal ── */}
      {pickerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPickerOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Choose your avatar</h2>
                <p className="text-xs text-slate-500 dark:text-white/45 mt-0.5">Pick a preset or upload your own photo</p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-6 pt-4 gap-1">
              {(["presets", "upload"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setPickerTab(tab); setUploadError(null); }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
                    pickerTab === tab
                      ? "bg-violet-600 text-white"
                      : "text-slate-500 dark:text-white/50 hover:bg-black/[0.06] dark:hover:bg-white/[0.07]"
                  }`}
                >
                  {tab === "presets" ? "Preset avatars" : "Upload photo"}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {pickerTab === "presets" && (
                <>
                  {/* Preview of selected */}
                  {pendingUrl && (
                    <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={pendingUrl} alt="Preview" className="w-8 h-8 rounded-lg" />
                      <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex-1">Preview — click Apply to save</p>
                    </div>
                  )}

                  {/* Grid */}
                  <div className="grid grid-cols-5 gap-3">
                    {PRESETS.map(({ seed, bg }) => {
                      const url = dicebearUrl(seed, bg);
                      const isActive = (pendingUrl ?? profile.avatarUrl) === url;
                      return (
                        <button
                          key={seed}
                          onClick={() => { setPendingUrl(url); setPendingBg(bg); }}
                          className="relative group rounded-2xl overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none"
                          style={{
                            boxShadow: isActive
                              ? "0 0 0 2.5px #7c3aed, 0 4px 16px rgba(124,58,237,0.3)"
                              : "0 1px 4px rgba(0,0,0,0.1)",
                          }}
                          title={seed}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={seed}
                            className="w-full aspect-square object-cover"
                          />
                          {/* Selected checkmark */}
                          {isActive && (
                            <div className="absolute inset-0 bg-violet-600/20 flex items-end justify-end p-1">
                              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Apply / Cancel */}
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setPickerOpen(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all
                        text-slate-600 border-black/[0.09] bg-black/[0.03] hover:bg-black/[0.06]
                        dark:text-white/70 dark:border-white/[0.10] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => pendingUrl && applyAvatar(pendingUrl, pendingBg)}
                      disabled={!pendingUrl || avatarUploading}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
                    >
                      {avatarUploading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving…
                        </span>
                      ) : "Apply avatar"}
                    </button>
                  </div>
                </>
              )}

              {pickerTab === "upload" && (
                <>
                  {/* Dropzone */}
                  <div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFileUpload(f);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
                      dragOver
                        ? "border-violet-500 bg-violet-500/8"
                        : "border-black/[0.12] bg-black/[0.02] hover:border-violet-500/50 hover:bg-violet-500/4 dark:border-white/[0.12] dark:bg-white/[0.02] dark:hover:border-violet-400/50"
                    }`}
                  >
                    {avatarUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 text-violet-500 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">Uploading…</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}>
                          <svg className="w-7 h-7 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-white">
                            Drop your photo here
                          </p>
                          <p className="text-xs text-slate-400 dark:text-white/40 mt-1">
                            or <span className="text-violet-600 dark:text-violet-400 font-semibold">click to browse</span>
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-white/30 mt-2">JPG, PNG, WebP · Max 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {uploadError}
                    </div>
                  )}

                  <button
                    onClick={() => setPickerOpen(false)}
                    className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                      text-slate-600 border-black/[0.09] bg-black/[0.03] hover:bg-black/[0.06]
                      dark:text-white/70 dark:border-white/[0.10] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Basic info */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50">Basic Info</p>

        <div>
          <label className="text-xs font-semibold mb-2 block text-slate-500 dark:text-white/60">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-white/60">Bio</label>
            <span className={`text-xs font-medium tabular-nums ${bio.length > 160 ? "text-red-500 dark:text-red-400" : "text-slate-400 dark:text-white/60"}`}>{bio.length} / 160</span>
          </div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A short bio about yourself…" className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* Public profile */}
      <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50">Public Profile</p>

        <div>
          <label className="text-xs font-semibold mb-2 block text-slate-500 dark:text-white/60">Your public URL</label>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}
          >
            <svg className="w-4 h-4 text-violet-500/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <span className="text-sm font-mono flex-1 truncate text-slate-500 dark:text-white/50">{publicUrl}</span>
            <button
              onClick={handleCopy}
              className={`shrink-0 text-xs font-semibold flex items-center gap-1 transition-colors ${copied ? "text-emerald-600 dark:text-emerald-400" : "text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"}`}
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block text-slate-500 dark:text-white/60">Profile URL slug</label>
          <div className="flex items-center">
            <span
              className="px-4 py-3 text-xs font-mono rounded-l-xl shrink-0 text-slate-400 dark:text-white/60"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border-input)", borderRight: "none" }}
            >
              proofi.ai/
            </span>
            <input
              value={slug}
              onChange={handleSlugChange}
              placeholder="your-slug"
              maxLength={30}
              className="flex-1 rounded-r-xl px-4 py-3 text-sm outline-none transition-all bg-black/[0.04] border border-black/[0.09] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-slate-800 placeholder-slate-400 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white dark:placeholder-white/20"
            />
          </div>
          {slugStatus !== "idle" && (
            <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${
              slugStatus === "available" ? "text-emerald-600 dark:text-emerald-400" :
              slugStatus === "taken" || slugStatus === "invalid" ? "text-red-600 dark:text-red-400" :
              "text-slate-400 dark:text-white/55"
            }`}>
              {slugStatus === "checking" && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {slugStatus === "available" && "✓ Available"}
              {slugStatus === "taken" && "✗ Already taken"}
              {slugStatus === "invalid" && "✗ 3–30 characters, letters, numbers, and hyphens only"}
              {slugStatus === "checking" && "Checking availability…"}
            </p>
          )}
        </div>
      </div>

      {/* Public profile appearance */}
      <div className="rounded-2xl p-6 space-y-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-white/50">Public Profile Appearance</p>
        <p className="text-xs text-slate-500 dark:text-white/55">Choose the default theme visitors see when they open your public profile URL.</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDefaultTheme("light")}
            className={`flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
              defaultTheme === "light"
                ? "border-violet-500/50 bg-violet-500/8"
                : "border-black/[0.09] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.03]"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              defaultTheme === "light" ? "bg-amber-100" : "bg-black/[0.06] dark:bg-white/[0.06]"
            }`}>
              <svg className={`w-4 h-4 ${defaultTheme === "light" ? "text-amber-500" : "text-slate-400 dark:text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${defaultTheme === "light" ? "text-violet-600 dark:text-violet-400" : "text-slate-600 dark:text-white/50"}`}>Light</p>
              <p className="text-xs text-slate-400 dark:text-white/60">Clean white background</p>
            </div>
            {defaultTheme === "light" && (
              <svg className="w-4 h-4 text-violet-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={() => setDefaultTheme("dark")}
            className={`flex-1 flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
              defaultTheme === "dark"
                ? "border-violet-500/50 bg-violet-500/8"
                : "border-black/[0.09] bg-black/[0.03] dark:border-white/[0.08] dark:bg-white/[0.03]"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              defaultTheme === "dark" ? "bg-slate-800" : "bg-black/[0.06] dark:bg-white/[0.06]"
            }`}>
              <svg className={`w-4 h-4 ${defaultTheme === "dark" ? "text-slate-300" : "text-slate-400 dark:text-white/50"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </div>
            <div className="text-left">
              <p className={`text-sm font-semibold ${defaultTheme === "dark" ? "text-violet-600 dark:text-violet-400" : "text-slate-600 dark:text-white/50"}`}>Dark</p>
              <p className="text-xs text-slate-400 dark:text-white/60">Sleek dark background</p>
            </div>
            {defaultTheme === "dark" && (
              <svg className="w-4 h-4 text-violet-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
          saveMsg.type === "success"
            ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20"
            : "text-red-700 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/20"
        }`}>
          {saveMsg.type === "success"
            ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          }
          {saveMsg.text}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saveDisabled}
        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.01] active:scale-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          boxShadow: saveDisabled ? "none" : "0 4px 20px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </span>
        ) : "Save changes"}
      </button>
    </div>
  );
}
