"use client";

export default function ProfileError({ error }: { error: Error }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0a0a12", color: "white" }}
    >
      <div className="text-center max-w-md space-y-4">
        <p className="text-5xl font-bold text-white/10">500</p>
        <h1 className="text-xl font-semibold text-white/80">Something went wrong</h1>
        <p className="text-sm text-white/40 leading-relaxed">
          We couldn&apos;t load this profile. This is likely a temporary issue — please try again in a moment.
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs text-red-400/70 bg-red-900/10 border border-red-500/10 rounded-xl p-3 text-left overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
