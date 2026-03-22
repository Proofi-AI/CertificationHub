import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#f0f0f5] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-[#0a0a0f]/80 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Proofi AI</span>
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
            Get started free
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
          Free forever · No credit card required
        </div>

        {/* Headline */}
        <h1 className="relative text-center text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 max-w-4xl">
          Your certificates,{" "}
          <span className="gradient-text">beautifully showcased</span>
        </h1>

        {/* Subheadline */}
        <p className="relative text-center text-lg md:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
          Upload your professional certificates and share them with the world via a stunning,
          shareable public profile. One link. All your credentials. Forever free.
        </p>

        {/* CTA Buttons */}
        <div className="relative flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold px-8 py-4 rounded-full text-base transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
          >
            Get started free
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
            See a live example
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
                  proofi.ai/sarahjohnson
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
                <p className="text-white/50 text-sm">Full-Stack Engineer · AI Enthusiast</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  7 certificates
                </span>
              </div>
            </div>

            {/* Domain tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["All", "Software Engineering", "Machine Learning", "Cloud"].map((tab, i) => (
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
                { name: "AWS Solutions Architect", issuer: "Amazon Web Services", domain: "Cloud Computing", date: "Jan 2024", color: "from-orange-500/20 to-yellow-500/20", badge: "Cloud" },
                { name: "TensorFlow Developer", issuer: "Google", domain: "Machine Learning", date: "Mar 2024", color: "from-blue-500/20 to-cyan-500/20", badge: "ML" },
                { name: "React Advanced Patterns", issuer: "Meta", domain: "Software Engineering", date: "Nov 2023", color: "from-violet-500/20 to-purple-500/20", badge: "SWE" },
                { name: "Kubernetes Administrator", issuer: "CNCF", domain: "Cloud Computing", date: "Aug 2023", color: "from-sky-500/20 to-blue-500/20", badge: "Cloud" },
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
                  <p className="text-white/30 text-xs mt-2">{cert.date}</p>
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
            <span className="text-xs text-white/70">proofi.ai/<strong>you</strong></span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-8">
          {[
            { value: "100%", label: "Free forever" },
            { value: "No code", label: "Setup required" },
            { value: "1 link", label: "Share everything" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center text-center">
              <span className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</span>
              <span className="text-sm text-white/40 mt-1">{stat.label}</span>
            </div>
          ))}
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
                title: "Your personal certificate URL",
                desc: "Get a clean, memorable link like proofi.ai/yourname. Share it on LinkedIn, your CV, or anywhere online. Anyone can view it — no sign-in required.",
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
                title: "Upload any certificate",
                desc: "Upload certificate images in JPG, PNG, or WebP. Organize them by domain — Software Engineering, Machine Learning, Cloud Computing, and more.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.240-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: "from-emerald-500/20 to-teal-500/20",
                accent: "text-emerald-400",
                border: "border-emerald-500/20",
                title: "Full control over visibility",
                desc: "Toggle any certificate public or private instantly. Show recruiters exactly what you want them to see, nothing more, nothing less.",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3.75h3m-3 3.75h3" />
                  </svg>
                ),
                color: "from-rose-500/20 to-pink-500/20",
                accent: "text-rose-400",
                border: "border-rose-500/20",
                title: "Smart domain filtering",
                desc: "Visitors can filter your certificates by domain. Make it easy for a hiring manager to find exactly the credentials they care about.",
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
              <span className="gradient-text">60 seconds</span>
            </h2>
            <p className="text-white/50 text-base">No technical setup. No complexity.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Create your account",
                desc: "Sign up with email or Google. Your profile URL is auto-generated from your name.",
                icon: "👤",
              },
              {
                step: "02",
                title: "Upload your certificates",
                desc: "Add certificate images, set the issuer, date, and domain. Takes 30 seconds per cert.",
                icon: "📄",
              },
              {
                step: "03",
                title: "Share your link",
                desc: "Copy your unique proofi.ai link and paste it anywhere. Your profile is live instantly.",
                icon: "🚀",
              },
            ].map((step, i) => (
              <div key={step.step} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/20 to-transparent z-10 translate-x-6 -translate-x-0" style={{ width: 'calc(100% - 24px)', left: 'calc(100% + 0px)' }} />
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

      {/* Social proof */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: "Finally a clean way to share all my AWS certs. My LinkedIn now just links to my Proofi profile.",
                name: "Marcus T.",
                role: "Cloud Engineer",
                avatar: "M",
                color: "from-orange-500 to-yellow-500",
              },
              {
                quote: "I sent my proofi.ai link in a job application and the recruiter specifically mentioned it. Got the interview.",
                name: "Anika P.",
                role: "Data Scientist",
                avatar: "A",
                color: "from-violet-500 to-blue-500",
              },
              {
                quote: "Love that anyone can see my certs without logging in. Exactly what I needed for my portfolio.",
                name: "James R.",
                role: "ML Engineer",
                avatar: "J",
                color: "from-emerald-500 to-teal-500",
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="glass rounded-2xl p-5 border border-white/8 hover:border-white/15 transition-all">
                <p className="text-white/60 text-sm leading-relaxed mb-4 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-xs font-bold text-white`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{testimonial.name}</p>
                    <p className="text-xs text-white/40">{testimonial.role}</p>
                  </div>
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
            {/* Background blobs inside CTA */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-blue-600/10 pointer-events-none" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to showcase your{" "}
                <span className="gradient-text">credentials?</span>
              </h2>
              <p className="text-white/50 mb-8 text-base">
                Join professionals who trust Proofi AI to represent their achievements.
                Free to start. No credit card needed.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold px-10 py-4 rounded-full text-base transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5"
              >
                Get started free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-xs text-white/30 mt-4">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="text-sm font-medium text-white/60">Proofi AI</span>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Proofi AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
