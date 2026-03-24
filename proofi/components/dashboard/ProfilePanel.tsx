"use client";

import { useRef, useState, useCallback } from "react";
import type { User } from "@prisma/client";
import { uploadAvatar } from "@/lib/utils/storage";
import { SLUG_REGEX } from "@/lib/constants";

interface Props {
  initialProfile: User;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all";

export default function ProfilePanel({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [name, setName] = useState(initialProfile.name ?? "");
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [slug, setSlug] = useState(initialProfile.slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, bio, slug }) });
    const json = await res.json();
    if (!res.ok) {
      setSaveMsg({ type: "error", text: json.error || "Save failed." });
    } else {
      setProfile(json.data);
      setSaveMsg({ type: "success", text: "Profile saved successfully!" });
      setTimeout(() => setSaveMsg(null), 3500);
    }
    setSaving(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (profile.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const saveDisabled = slugStatus === "taken" || slugStatus === "invalid" || bio.length > 160 || saving;

  return (
    <div className="space-y-5">

      {/* Profile photo card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.12em] mb-5">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 0 0 2px rgba(124,58,237,0.45), 0 0 0 5px rgba(124,58,237,0.08), 0 8px 24px rgba(0,0,0,0.4)" }}
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
            <div className="absolute inset-0 rounded-2xl bg-black/55 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
              {avatarUploading ? (
                <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm font-semibold transition-colors"
              style={{ color: "#a78bfa" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#c4b5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#a78bfa")}
            >
              {avatarUploading ? "Uploading…" : "Change photo"}
            </button>
            <p className="text-xs text-white/25 mt-1">JPG, PNG, or WebP · Max 5MB</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

      {/* Basic info card */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.12em]">Basic Info</p>

        <div>
          <label className="text-xs font-semibold text-white/40 mb-2 block">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-white/40">Bio</label>
            <span className={`text-xs font-medium tabular-nums ${bio.length > 160 ? "text-red-400" : "text-white/25"}`}>{bio.length} / 160</span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A short bio about yourself…"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Public profile card */}
      <div
        className="rounded-2xl p-6 space-y-5"
        style={{ background: "#0d0d18", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.12em]">Public Profile</p>

        {/* URL display */}
        <div>
          <label className="text-xs font-semibold text-white/40 mb-2 block">Your public URL</label>
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}
          >
            <svg className="w-4 h-4 text-violet-400/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            <span className="text-sm text-white/50 font-mono flex-1 truncate">{publicUrl}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 text-xs font-semibold flex items-center gap-1 transition-colors"
              style={{ color: copied ? "#6ee7b7" : "#a78bfa" }}
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
              )}
            </button>
          </div>
        </div>

        {/* Slug */}
        <div>
          <label className="text-xs font-semibold text-white/40 mb-2 block">Profile URL slug</label>
          <div className="flex items-center">
            <span
              className="px-4 py-3 text-xs font-mono text-white/25 rounded-l-xl shrink-0"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRight: "none" }}
            >
              proofi.ai/
            </span>
            <input
              value={slug}
              onChange={handleSlugChange}
              placeholder="your-slug"
              maxLength={30}
              className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 rounded-r-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
            />
          </div>
          {slugStatus !== "idle" && (
            <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${
              slugStatus === "available" ? "text-emerald-400" :
              slugStatus === "taken" || slugStatus === "invalid" ? "text-red-400" :
              "text-white/35"
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

      {/* Save message */}
      {saveMsg && (
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
            saveMsg.type === "success"
              ? "text-emerald-300 bg-emerald-500/10 border border-emerald-500/20"
              : "text-red-300 bg-red-500/10 border border-red-500/20"
          }`}
        >
          {saveMsg.type === "success" ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          )}
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
