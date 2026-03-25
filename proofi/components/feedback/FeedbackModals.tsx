"use client";

import { useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Bug Report Modal ───────────────────────────────────────────────────────
export function BugReportModal({ isOpen, onClose }: ModalProps) {
  const [step, setStep] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("submitting");
    setErrorMsg("");

    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "bug");
      fd.append("metadata", JSON.stringify({
        userAgent: navigator.userAgent,
        url: window.location.href,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      }));

      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Submission failed");

      setStep("success");
      setTimeout(() => { setStep("idle"); onClose(); }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStep("error");
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-orange-500/20 shadow-2xl shadow-orange-500/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1f35 0%, #131627 100%)" }}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
          <button type="button" onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-2xl">🐛</div>
            <div>
              <h3 className="text-lg font-bold text-white">Report a Bug</h3>
              <p className="text-xs text-white/40">Help us fix issues faster</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === "success" ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h4 className="text-xl font-bold text-white mb-2">Thanks for reporting!</h4>
              <p className="text-white/50 text-sm">Our team will look into this.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Bug Summary <span className="text-orange-400">*</span></label>
                <input name="name" required placeholder="e.g. Upload button crashes on Safari"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Steps to Reproduce <span className="text-orange-400">*</span></label>
                <textarea name="message" required rows={3}
                  placeholder="1. Go to dashboard&#10;2. Click Upload&#10;3. Select PDF file&#10;4. App crashes"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Priority</label>
                  <select name="priority"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 appearance-none">
                    <option value="low" className="bg-[#1a1f35]">🟡 Low</option>
                    <option value="medium" className="bg-[#1a1f35]">🟠 Medium</option>
                    <option value="high" className="bg-[#1a1f35]">🔴 High – Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Your Email</label>
                  <input name="email" type="email" placeholder="for follow-up"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Screenshot (Optional)</label>
                <input type="file" name="file" accept="image/*"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-3 py-2.5 text-sm text-white/70 focus:outline-none transition-all
                    file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-orange-500/20 file:text-orange-300 hover:file:bg-orange-500/30 cursor-pointer" />
              </div>

              {step === "error" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400 text-center">{errorMsg}</div>
              )}

              <p className="text-[10px] text-white/20 text-center">
                🔒 Browser, OS & URL are captured automatically to help diagnose the issue.
              </p>

              <button disabled={step === "submitting"}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60
                  bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 shadow-lg shadow-orange-500/20 active:scale-[0.98]">
                {step === "submitting" ? "Sending…" : "Submit Bug Report"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Request Modal ─────────────────────────────────────────────────
export function FeatureRequestModal({ isOpen, onClose }: ModalProps) {
  const [step, setStep] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("submitting");
    setErrorMsg("");

    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "feature");

      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Submission failed");

      setStep("success");
      setTimeout(() => { setStep("idle"); onClose(); }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStep("error");
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-violet-500/20 shadow-2xl shadow-violet-500/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1f35 0%, #131627 100%)" }}>

        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
          <button type="button" onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-2xl">💡</div>
            <div>
              <h3 className="text-lg font-bold text-white">Request a Feature</h3>
              <p className="text-xs text-white/40">Your idea could shape our roadmap</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {step === "success" ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h4 className="text-xl font-bold text-white mb-2">Idea received! 🚀</h4>
              <p className="text-white/50 text-sm">We'll review it for our roadmap.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Feature Title <span className="text-violet-400">*</span></label>
                <input name="name" required placeholder="e.g. Bulk export certificates as PDF"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Why is this needed? <span className="text-violet-400">*</span></label>
                <textarea name="message" required rows={4}
                  placeholder="As a user I want to be able to... so that I can..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Your Email (Optional)</label>
                <input name="email" type="email" placeholder="so we can follow up with you"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 focus:bg-white/[0.08] transition-all" />
              </div>

              {step === "error" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400 text-center">{errorMsg}</div>
              )}

              <button disabled={step === "submitting"}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60
                  bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 active:scale-[0.98]">
                {step === "submitting" ? "Submitting…" : "Submit Feature Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── General Feedback Modal ────────────────────────────────────────────────
export function GeneralFeedbackModal({ isOpen, onClose }: ModalProps) {
  const [step, setStep] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep("submitting");
    setErrorMsg("");

    try {
      const fd = new FormData(e.currentTarget);
      fd.append("type", "general");

      const res = await fetch("/api/feedback", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Submission failed");

      setStep("success");
      setTimeout(() => { setStep("idle"); onClose(); }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setStep("error");
      setErrorMsg(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a1f35 0%, #131627 100%)" }}>

        <div className="relative px-6 pt-6 pb-4 border-b border-white/5">
          <button type="button" onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all">
            ✕
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">💬</div>
            <div>
              <h3 className="text-lg font-bold text-white">Share Feedback</h3>
              <p className="text-xs text-white/40">Anything on your mind</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          {step === "success" ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl mx-auto mb-4">✓</div>
              <h4 className="text-xl font-bold text-white mb-2">Thanks for sharing!</h4>
              <p className="text-white/50 text-sm">We appreciate your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Subject <span className="text-emerald-400">*</span></label>
                <input name="name" required placeholder="What's this about?"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Message <span className="text-emerald-400">*</span></label>
                <textarea name="message" required rows={4} placeholder="Share your thoughts..."
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5">Your Email (Optional)</label>
                <input name="email" type="email" placeholder="for follow-up"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all" />
              </div>

              {step === "error" && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400 text-center">{errorMsg}</div>
              )}

              <button disabled={step === "submitting"}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-60
                  bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
                {step === "submitting" ? "Sending…" : "Send Feedback"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
