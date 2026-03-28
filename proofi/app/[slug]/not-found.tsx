import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)", color: "var(--foreground)" }}
    >
      <div className="text-center max-w-md space-y-4">
        <p className="text-5xl font-bold text-white/10">404</p>
        <h1 className="text-xl font-semibold text-white/80">Profile not found</h1>
        <p className="text-sm text-white/40 leading-relaxed">
          This profile doesn&apos;t exist or may have been removed. Double-check the URL, or create your own profile.
        </p>
        <Link
          href="/"
          className="inline-block mt-2 text-sm font-medium px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-all border border-white/10"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
