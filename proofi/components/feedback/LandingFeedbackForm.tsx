"use client";

import { useState } from "react";

export default function LandingFeedbackForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [category, setCategory] = useState("question");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("type", category);
      
      const metadata = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
      };
      formData.append("metadata", JSON.stringify(metadata));

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to submit feedback");
      }

      setStatus("success");
      const form = e.target as HTMLFormElement;
      form.reset();
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <section id="feedback" className="py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Help us <span className="gradient-text">improve</span>
          </h2>
          <p className="text-white/50 text-lg">
            Have a feature idea, found a bug, or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl relative bg-white/2 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Your name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="category" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "question", label: "General Question", icon: "❓" },
                  { id: "feature", label: "Feature Idea", icon: "💡" },
                  { id: "bug", label: "Found a Bug", icon: "🐛" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                      category === item.id
                        ? "bg-violet-600/20 border-violet-500/50 text-white"
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-xs font-semibold text-white/40 uppercase tracking-wider ml-1">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                placeholder="Share your thoughts..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
              ></textarea>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "submitting" ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : status === "success" ? (
                  <>
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Message sent!
                  </>
                ) : (
                  "Send feedback"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
