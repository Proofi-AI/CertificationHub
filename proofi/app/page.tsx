import Link from "next/link";
import Image from "next/image";
import LandingFeedbackForm from "@/components/feedback/LandingFeedbackForm";
import DisclaimerModal from "@/components/DisclaimerModal";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="flex items-center">
          <Image src="/ProofiLogo.png" alt="Proofi AI" width={36} height={36} className="rounded-lg" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-violet-500/20"
          >
            Create profile
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16">
        {/* Background glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Badge */}
        <div className="relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Now live · proofihub.vercel.app
        </div>

        {/* Headline */}
        <h1 className="relative text-center text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 max-w-4xl">
          Your certificates,{" "}
          <span className="gradient-text">beautifully showcased</span>
        </h1>

        {/* Subheadline */}
        <p className="relative text-center text-lg md:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
          Upload your professional certificates, organise them by domain, and share a
          clean public profile with anyone — no login required to view.
        </p>

        {/* CTA Buttons */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-full text-base transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
          >
            Create your profile
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#showcase"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white px-6 py-4 text-base transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See an example
          </a>
        </div>

        {/* Showcase Card Preview */}
        <div id="showcase" className="relative w-full max-w-3xl float-animation">
          <div className="glass rounded-2xl p-6 shadow-2xl border border-white/10">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-white/5 rounded-md px-4 py-1 text-xs text-white/40 font-mono">
                  proofihub.vercel.app/sarahjohnson
                </div>
              </div>
            </div>

            {/* Profile header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                S
              </div>
              <div>
                <h3 className="font-semibold text-lg">Sarah Johnson</h3>
                <p className="text-white/50 text-sm">Full-Stack Engineer · Cloud Enthusiast</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  7 certificates
                </span>
              </div>
            </div>

            {/* Domain tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["All", "Software Engineering", "Cloud Computing", "Machine Learning"].map((tab, i) => (
                <span
                  key={tab}
                  className={`text-xs px-3 py-1 rounded-full cursor-pointer transition-all ${
                    i === 0
                      ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                      : "bg-white/5 text-white/40 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Certificate cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "AWS Solutions Architect", issuer: "Amazon Web Services", badge: "Cloud", color: "from-orange-500/20 to-yellow-500/20" },
                { name: "React Advanced Patterns", issuer: "Meta", badge: "SWE", color: "from-violet-500/20 to-purple-500/20" },
                { name: "TensorFlow Developer", issuer: "Google", badge: "ML", color: "from-blue-500/20 to-cyan-500/20" },
                { name: "Kubernetes Administrator", issuer: "CNCF", badge: "Cloud", color: "from-sky-500/20 to-blue-500/20" },
              ].map((cert) => (
                <div
                  key={cert.name}
                  className={`relative rounded-xl p-4 bg-gradient-to-br ${cert.color} border border-white/5 hover:border-white/15 transition-all cursor-pointer group`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                      {cert.badge}
                    </span>
                  </div>
                  <p className="font-medium text-sm leading-tight mb-1 group-hover:text-white transition-colors">{cert.name}</p>
                  <p className="text-white/40 text-xs">{cert.issuer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 glass rounded-xl px-4 py-2 border border-white/10 hidden md:flex items-center gap-2 shadow-xl">
            <span className="text-emerald-400">✓</span>
            <span className="text-xs text-white/70">Instantly shareable</span>
          </div>
          <div className="absolute -bottom-4 -left-4 glass rounded-xl px-4 py-2 border border-white/10 hidden md:flex items-center gap-2 shadow-xl">
            <span className="text-violet-400">🔗</span>
            <span className="text-xs text-white/70">proofihub.vercel.app/<strong>you</strong></span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">stand out</span>
            </h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              Built for professionals who take their credentials seriously.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                ),
                color: "from-violet-500/20 to-purple-500/20",
                accent: "text-violet-400",
                border: "border-violet-500/20",
                title: "Your personal profile URL",
                desc: "Get a clean, memorable link at proofihub.vercel.app/yourname. Share it on LinkedIn, your CV, or anywhere. Anyone can view your profile — no account required.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
                color: "from-blue-500/20 to-cyan-500/20",
                accent: "text-blue-400",
                border: "border-blue-500/20",
                title: "Upload images and PDFs",
                desc: "Upload certificate images (JPG, PNG, WebP) or PDF documents. Attach an issuer, date, domain, and an optional description. All stored securely.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: "from-emerald-500/20 to-teal-500/20",
                accent: "text-emerald-400",
                border: "border-emerald-500/20",
                title: "Full control over visibility",
                desc: "Toggle any certificate public or private instantly with a single switch. Show recruiters exactly what you want — nothing more, nothing less.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
                  </svg>
                ),
                color: "from-rose-500/20 to-pink-500/20",
                accent: "text-rose-400",
                border: "border-rose-500/20",
                title: "Smart sorting & filtering",
                desc: "Sort by date, domain, name, or strength. Drag to reorder manually. Visitors can filter by domain — making it easy to find the credentials they care about.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
                color: "from-amber-500/20 to-orange-500/20",
                accent: "text-amber-400",
                border: "border-amber-500/20",
                title: "Certificate completeness score",
                desc: "A visual strength bar shows how complete each certificate entry is. Add a credential ID, upload a file, and fill in all dates to reach a full score.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                  </svg>
                ),
                color: "from-slate-500/20 to-slate-400/20",
                accent: "text-slate-400",
                border: "border-slate-500/20",
                title: "Light & dark public profile",
                desc: "Choose whether your public profile is displayed in light or dark mode by default. A clean, professional look in either theme.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`glass rounded-2xl p-6 bg-gradient-to-br ${feature.color} border ${feature.border} hover:border-white/15 transition-all group`}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${feature.accent} group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/2 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Up and running in{" "}
              <span className="gradient-text">minutes</span>
            </h2>
            <p className="text-white/50 text-base">Three simple steps to your professional certificate profile.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up with your email or Google account. Your personal profile URL is generated from your name automatically.",
                icon: "👤",
              },
              {
                step: "02",
                title: "Upload your certificates",
                desc: "Add certificate images or PDFs. Fill in the issuer, date, and domain. Add an optional description for context.",
                icon: "📄",
              },
              {
                step: "03",
                title: "Share your profile",
                desc: "Copy your unique proofihub.vercel.app link and share it anywhere. Your profile is live and viewable by anyone instantly.",
                icon: "🚀",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-10" style={{ width: "calc(100% - 24px)", left: "calc(100% + 0px)" }} />
                )}
                <div className="glass rounded-2xl p-6 text-center border border-white/8 hover:border-white/15 transition-all">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <div className="text-xs font-mono text-white/30 mb-2">{step.step}</div>
                  <h3 className="font-semibold text-base mb-2">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-blue-600/10 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to showcase your{" "}
                <span className="gradient-text">credentials?</span>
              </h2>
              <p className="text-white/50 mb-8 text-base">
                Create your profile in minutes and share a link that speaks for itself.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold px-10 py-4 rounded-full text-base transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
              >
                Create your profile
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <LandingFeedbackForm />

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-sm font-medium text-white/60">Proofi Hub</span>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Proofi Hub. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/30">
            <DisclaimerModal />
          </div>
        </div>
      </footer>
    </div>
  );
}
