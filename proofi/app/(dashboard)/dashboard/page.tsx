import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there";

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5]">
      {/* Top navbar */}
      <nav className="border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-base tracking-tight text-white/90">Proofi AI</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {initials}
              </div>
              <span className="text-sm text-white/60 hidden sm:block">{displayName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Bg blobs */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-violet-600/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-0 left-0 w-80 h-80 bg-blue-600/6 rounded-full blur-[120px] pointer-events-none" />

        {/* Welcome banner */}
        <div className="relative glass rounded-2xl p-8 border border-white/10 overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/8 to-blue-600/5 pointer-events-none" />
          <div className="relative">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/30 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  Welcome back, {displayName.split(" ")[0]}! 👋
                </h1>
                <p className="text-white/50 text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coming soon panels */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              ),
              color: "text-violet-400",
              bg: "from-violet-500/10 to-purple-500/10",
              border: "border-violet-500/15",
              title: "My Certificates",
              value: "0",
              label: "certificates added",
              cta: "Add your first certificate",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              ),
              color: "text-blue-400",
              bg: "from-blue-500/10 to-cyan-500/10",
              border: "border-blue-500/15",
              title: "Public Profile",
              value: "—",
              label: "your shareable link",
              cta: "Set up your profile URL",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              color: "text-emerald-400",
              bg: "from-emerald-500/10 to-teal-500/10",
              border: "border-emerald-500/15",
              title: "Profile Views",
              value: "0",
              label: "total views",
              cta: "Share your profile to get views",
            },
          ].map((card) => (
            <div
              key={card.title}
              className={`glass rounded-2xl p-6 bg-gradient-to-br ${card.bg} border ${card.border} hover:border-white/15 transition-all`}
            >
              <div className={`mb-4 ${card.color}`}>{card.icon}</div>
              <div className="text-2xl font-bold mb-0.5">{card.value}</div>
              <div className="text-xs text-white/40 mb-4">{card.label}</div>
              <div className="text-sm font-medium text-white/60">{card.title}</div>
              <p className="text-xs text-white/30 mt-1">{card.cta}</p>
            </div>
          ))}
        </div>

        {/* Main content area — coming soon */}
        <div className="glass rounded-2xl p-12 border border-white/8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Your dashboard is being set up</h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
            The full dashboard — with certificate uploads, your public profile link, and domain management — is coming very soon.
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
