"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import type { User } from "@prisma/client";
import { uploadAvatar } from "@/lib/utils/storage";
import { SLUG_REGEX } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

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

  // Password change state
  const [isGoogleOnly, setIsGoogleOnly]     = useState(false);
  const [userEmail, setUserEmail]           = useState("");
  const [pwModalOpen, setPwModalOpen]       = useState(false);
  const [oldPw, setOldPw]                   = useState("");
  const [newPw, setNewPw]                   = useState("");
  const [confirmPw, setConfirmPw]           = useState("");
  const [showOld, setShowOld]               = useState(false);
  const [showNew, setShowNew]               = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [pwLoading, setPwLoading]           = useState(false);
  const [pwMsg, setPwMsg]                   = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const hasEmailProvider = data.user.identities?.some((i) => i.provider === "email");
      setIsGoogleOnly(!hasEmailProvider);
      setUserEmail(data.user.email ?? "");
    });
  }, []);

  const closePwModal = () => {
    setPwModalOpen(false);
    setOldPw(""); setNewPw(""); setConfirmPw("");
    setShowOld(false); setShowNew(false); setShowConfirm(false);
    setPwMsg(null);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "New passwords don't match." }); return; }
    if (newPw.length < 6)   { setPwMsg({ type: "error", text: "Password must be at least 6 characters." }); return; }

    setPwLoading(true);
    const supabase = createClient();

    // For email users, verify old password first by re-authenticating
    if (!isGoogleOnly) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: userEmail, password: oldPw });
      if (signInError) {
        setPwMsg({ type: "error", text: "Old password is incorrect." });
        setPwLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    if (updateError) {
      setPwMsg({ type: "error", text: updateError.message });
      setPwLoading(false);
      return;
    }

    setPwMsg({ type: "success", text: "Password updated successfully!" });
    setPwLoading(false);
    // Close modal after short delay so user sees the success message
    setTimeout(() => { closePwModal(); setIsGoogleOnly(false); }, 1800);
  };

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

  const initials = (profile.name || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const saveDisabled = slugStatus === "taken" || slugStatus === "invalid" || bio.length > 160 || saving;

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-black/[0.04] border border-black/[0.09] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-slate-800 placeholder-slate-400 dark:bg-white/[0.06] dark:border-white/[0.12] dark:text-white dark:placeholder-white/35";

  return (
    <div className="space-y-5">

      {/* Profile photo */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-5 text-slate-400 dark:text-white/50">Profile Photo</p>
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileRef.current?.click()}>
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 0 0 2px rgba(124,58,237,0.45), 0 0 0 5px rgba(124,58,237,0.08), 0 8px 24px rgba(0,0,0,0.15)" }}
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
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
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
              className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              {avatarUploading ? "Uploading…" : "Change photo"}
            </button>
            <p className="text-xs mt-1 text-slate-400 dark:text-white/60">JPG, PNG, or WebP · Max 5MB</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
      </div>

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

      {/* Password & Security */}
      <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] mb-4 text-slate-400 dark:text-white/50">Password &amp; Security</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-white">
              {isGoogleOnly ? "Set a password" : "Change password"}
            </p>
            <p className="text-xs mt-0.5 text-slate-400 dark:text-white/50">
              {isGoogleOnly
                ? "You signed in with Google. You can set a password to also log in with email."
                : "Update your account password."}
            </p>
          </div>
          <button
            onClick={() => setPwModalOpen(true)}
            className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border
              text-violet-600 border-violet-500/30 bg-violet-500/8 hover:bg-violet-500/14
              dark:text-violet-400 dark:border-violet-400/30 dark:bg-violet-400/8 dark:hover:bg-violet-400/14"
          >
            {isGoogleOnly ? "Set password" : "Change"}
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

      {/* ── Password change modal ── */}
      {pwModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closePwModal(); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {isGoogleOnly ? "Set a password" : "Change password"}
                </h2>
                <p className="text-xs mt-0.5 text-slate-500 dark:text-white/50">
                  {isGoogleOnly
                    ? "You'll be able to sign in with Google or with email + password."
                    : "Enter your current password to confirm your identity."}
                </p>
              </div>
              <button
                onClick={closePwModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Old password — only for email users */}
              {!isGoogleOnly && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-slate-500 dark:text-white/60">Current password</label>
                  <div className="relative">
                    <input
                      type={showOld ? "text" : "password"}
                      value={oldPw}
                      onChange={(e) => { setOldPw(e.target.value); setPwMsg(null); }}
                      placeholder="Your current password"
                      required
                      autoFocus
                      className={inputClass + " pr-11"}
                    />
                    <button type="button" onClick={() => setShowOld((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                      {showOld
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* New password */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-slate-500 dark:text-white/60">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => { setNewPw(e.target.value); setPwMsg(null); }}
                    placeholder="At least 6 characters"
                    required
                    autoFocus={isGoogleOnly}
                    className={inputClass + " pr-11"}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                    {showNew
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-slate-500 dark:text-white/60">Confirm new password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setPwMsg(null); }}
                    placeholder="Repeat new password"
                    required
                    className={inputClass + " pr-11"}
                  />
                  <button type="button" onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors">
                    {showConfirm
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {pwMsg && (
                <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                  pwMsg.type === "success"
                    ? "text-emerald-700 bg-emerald-50 border border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                    : "text-red-700 bg-red-50 border border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/20"
                }`}>
                  {pwMsg.type === "success"
                    ? <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  }
                  {pwMsg.text}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closePwModal}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border
                    text-slate-600 border-black/[0.09] bg-black/[0.03] hover:bg-black/[0.06]
                    dark:text-white/70 dark:border-white/[0.10] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    boxShadow: pwLoading ? "none" : "0 4px 16px rgba(124,58,237,0.35)",
                  }}
                >
                  {pwLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Saving…
                    </span>
                  ) : (isGoogleOnly ? "Set password" : "Update password")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
