"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MAX_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 15;
const LS_KEY = "fp_attempts";

interface AttemptsRecord {
  count: number;
  lockedAt: number | null;
}

function getAttemptsRecord(): AttemptsRecord {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { count: 0, lockedAt: null };
    return JSON.parse(raw) as AttemptsRecord;
  } catch {
    return { count: 0, lockedAt: null };
  }
}

function saveAttemptsRecord(record: AttemptsRecord) {
  localStorage.setItem(LS_KEY, JSON.stringify(record));
}

function clearAttemptsRecord() {
  localStorage.removeItem(LS_KEY);
}

function VerifyForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("fp_email");
    const storedQuestions = sessionStorage.getItem("fp_questions");

    if (!storedEmail || !storedQuestions) {
      router.replace("/forgot-password");
      return;
    }

    setEmail(storedEmail);

    try {
      setQuestions(JSON.parse(storedQuestions) as string[]);
    } catch {
      router.replace("/forgot-password");
      return;
    }

    // Check lockout state
    const record = getAttemptsRecord();
    if (record.lockedAt) {
      const elapsed = Date.now() - record.lockedAt;
      const lockoutMs = LOCKOUT_MINUTES * 60 * 1000;
      if (elapsed < lockoutMs) {
        setLocked(true);
        setLockoutRemaining(Math.ceil((lockoutMs - elapsed) / 60000));
      } else {
        // Lockout expired — reset
        clearAttemptsRecord();
      }
    }
  }, [router]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!locked) return;
    const interval = setInterval(() => {
      const record = getAttemptsRecord();
      if (!record.lockedAt) {
        setLocked(false);
        clearInterval(interval);
        return;
      }
      const elapsed = Date.now() - record.lockedAt;
      const lockoutMs = LOCKOUT_MINUTES * 60 * 1000;
      if (elapsed >= lockoutMs) {
        clearAttemptsRecord();
        setLocked(false);
        clearInterval(interval);
      } else {
        setLockoutRemaining(Math.ceil((lockoutMs - elapsed) / 60000));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [locked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || questions.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          questionText: questions[currentQuestionIndex],
          answer: answer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      if (data.correct) {
        // Correct answer — clear attempts and proceed to reset
        clearAttemptsRecord();
        sessionStorage.setItem("fp_verified_userId", data.userId);
        router.push("/forgot-password/reset");
        return;
      }

      // Wrong answer — increment attempt counter
      const record = getAttemptsRecord();
      const newCount = record.count + 1;

      if (newCount >= MAX_ATTEMPTS) {
        // Lock the flow
        saveAttemptsRecord({ count: newCount, lockedAt: Date.now() });
        setLocked(true);
        setLockoutRemaining(LOCKOUT_MINUTES);
        setError(null);
      } else {
        saveAttemptsRecord({ count: newCount, lockedAt: null });
        // Cycle to the next question
        const nextIndex = (currentQuestionIndex + 1) % questions.length;
        setCurrentQuestionIndex(nextIndex);
        setAnswer("");
        setError(
          `Incorrect answer. Please try again. (${MAX_ATTEMPTS - newCount} attempt${
            MAX_ATTEMPTS - newCount === 1 ? "" : "s"
          } remaining)`
        );
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  if (!email || questions.length === 0) {
    return null;
  }

  if (locked) {
    return (
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
            }}
          >
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Too many attempts</h2>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">
            You have exceeded the maximum number of attempts. Please wait{" "}
            <span className="text-white/80 font-medium">
              {lockoutRemaining} minute{lockoutRemaining !== 1 ? "s" : ""}
            </span>{" "}
            before trying again.
          </p>
          <p className="text-xs text-white/30 mb-6">
            If you need immediate access, you can{" "}
            <Link
              href="/contact-reset"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              request a manual reset
            </Link>
            .
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Verify your identity
          </h1>
          <p className="text-white/50 text-sm">
            Answer the security question below to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Security question
            </label>
            <div
              className="rounded-xl px-4 py-3 mb-4 text-sm font-medium text-white/90"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              {questions[currentQuestionIndex]}
            </div>

            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Your answer
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                setError(null);
              }}
              placeholder="Type your answer"
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
                Verifying…
              </span>
            ) : (
              "Verify answer"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          <Link
            href="/forgot-password"
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            ← Use a different email
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
