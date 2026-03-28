"use client";

import Link from "next/link";

export default function SettingsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)", color: "var(--foreground)" }}
    >
      <div className="text-center max-w-sm space-y-4">
        <h1 className="text-lg font-semibold text-white/80">Couldn&apos;t load settings</h1>
        <p className="text-sm text-white/40 leading-relaxed">
          A temporary error occurred. This usually resolves on its own.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={reset}
            className="text-sm font-medium px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all border border-white/10"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-sm font-medium px-5 py-2.5 rounded-xl text-white/40 hover:text-white/70 transition-all"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
