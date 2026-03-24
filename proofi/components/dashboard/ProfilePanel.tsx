"use client";

import { useRef, useState, useCallback } from "react";
import type { User } from "@prisma/client";
import { uploadAvatar } from "@/lib/utils/storage";
import { SLUG_REGEX } from "@/lib/constants";

interface Props {
  initialProfile: User;
  onClose?: () => void;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function ProfilePanel({ initialProfile, onClose }: Props) {
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

  // ── Avatar upload ──────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      setProfile((p) => ({ ...p, avatarUrl: url }));
    } catch {
      setSaveMsg({ type: "error", text: "Avatar upload failed. Try again." });
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Slug validation ────────────────────────────────────────────
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

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (slugStatus === "taken" || slugStatus === "invalid") return;
    setSaving(true);
    setSaveMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, slug }),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaveMsg({ type: "error", text: json.error || "Save failed." });
    } else {
      setProfile(json.data);
      setSaveMsg({ type: "success", text: "Profile saved!" });
      setTimeout(() => setSaveMsg(null), 3000);
    }
    setSaving(false);
  };

  // ── Copy URL ───────────────────────────────────────────────────
  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = (profile.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const saveDisabled = slugStatus === "taken" || slugStatus === "invalid" || bio.length > 160 || saving;

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
            aria-label="Close settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Public URL */}
      <div>
        <label className="text-xs text-white/50 mb-2 block">Your public profile URL</label>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
          <span className="text-sm text-white/40 font-mono flex-1 truncate">{publicUrl}</span>
          <button
            onClick={handleCopy}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors shrink-0 flex items-center gap-1"
          >
            {copied ? (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
            )}
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div>
        <label className="text-xs text-white/50 mb-2 block">Profile photo</label>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xl font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                {avatarUploading ? (
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                )}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <p className="text-xs text-white/30 leading-relaxed">Click to upload<br />JPG, PNG, or WebP · Max 5MB</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Full name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
          placeholder="Your name"
        />
      </div>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs text-white/50">Bio</label>
          <span className={`text-xs ${bio.length > 160 ? "text-red-400" : "text-white/30"}`}>{bio.length}/160</span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all resize-none"
          placeholder="A short bio about yourself…"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="text-xs text-white/50 mb-1.5 block">Profile URL</label>
        <div className="flex items-center gap-0">
          <span className="bg-white/5 border border-r-0 border-white/10 rounded-l-xl px-3 py-2.5 text-xs text-white/30 shrink-0">proofi.ai/</span>
          <input
            value={slug}
            onChange={handleSlugChange}
            className="flex-1 bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-r-xl px-3 py-2.5 text-sm text-white placeholder-white/25 outline-none transition-all"
            placeholder="your-slug"
            maxLength={30}
          />
        </div>
        {slugStatus !== "idle" && (
          <p className={`text-xs mt-1.5 flex items-center gap-1 ${
            slugStatus === "available" ? "text-emerald-400" :
            slugStatus === "taken" || slugStatus === "invalid" ? "text-red-400" :
            "text-white/40"
          }`}>
            {slugStatus === "checking" && <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>}
            {slugStatus === "available" && "✓ Available"}
            {slugStatus === "taken" && "✗ Already taken"}
            {slugStatus === "invalid" && "✗ 3–30 characters, letters, numbers, and hyphens only"}
            {slugStatus === "checking" && "Checking…"}
          </p>
        )}
      </div>

      {/* Save message */}
      {saveMsg && (
        <p className={`text-sm ${saveMsg.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
          {saveMsg.text}
        </p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saveDisabled}
        className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {saving ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
