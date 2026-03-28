"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactResetPage() {
  const [form, setForm] = useState({ email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contact-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Send failed");
      }

      setSuccess(true);
    } catch {
      setError(
        "Something went wrong sending your request. Please email us directly at proofiai26@gmail.com"
      );
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-3">
            Request a password reset
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            If you are unable to reset your password using your security
            questions, fill in the form below and we will reset it manually
            within 24 hours.
          </p>
        </div>

        {success ? (
          <div
            className="rounded-xl px-5 py-4 text-sm leading-relaxed"
            style={{
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "rgba(110,231,183,1)",
            }}
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>
                Your request has been sent. We will get back to you within 24
                hours.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="sarah@example.com"
                required
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Message
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Please describe your issue and confirm the email address on your account"
                required
                rows={5}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all resize-none"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <svg
                  className="w-4 h-4 text-red-400 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending…
                </span>
              ) : (
                "Submit"
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-white/40 mt-6">
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
