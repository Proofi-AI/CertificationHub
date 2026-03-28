"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/forgot-password/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.status === "not_found") {
        // Security: don't reveal whether the email exists
        setInfoMessage(
          "If an account exists with that email, you will be able to continue."
        );
        setLoading(false);
        return;
      }

      if (data.status === "no_security") {
        setError(
          "Your account does not have security questions set up. Please use the contact form to request a manual reset."
        );
        setLoading(false);
        return;
      }

      if (data.status === "found" && data.questions) {
        // Store email and questions in sessionStorage, proceed to verify step
        sessionStorage.setItem("fp_email", email.trim());
        sessionStorage.setItem("fp_questions", JSON.stringify(data.questions));
        router.push("/forgot-password/verify");
        return;
      }

      setError("Unexpected response. Please try again.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Forgot password?
          </h1>
          <p className="text-white/50 text-sm">
            Enter your email to verify your identity using your security
            questions.
          </p>
        </div>

        {infoMessage && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-sm"
            style={{
              background: "rgba(59,130,246,0.12)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "rgba(147,197,253,1)",
            }}
          >
            {infoMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
                setInfoMessage(null);
              }}
              placeholder="sarah@example.com"
              required
              autoFocus
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-all"
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
              <p className="text-sm text-red-400">
                {error}{" "}
                {error.includes("contact form") && (
                  <Link
                    href="/contact-reset"
                    className="underline hover:text-red-300 transition-colors"
                  >
                    Go to contact form
                  </Link>
                )}
              </p>
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
                Checking…
              </span>
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  );
}
