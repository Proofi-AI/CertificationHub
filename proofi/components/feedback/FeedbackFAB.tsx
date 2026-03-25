"use client";

import { useState, useEffect } from "react";
import { BugReportModal, FeatureRequestModal, GeneralFeedbackModal } from "./FeedbackModals";

export default function FeedbackFAB() {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<"bug" | "feature" | "general" | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const openModal = (type: "bug" | "feature" | "general") => {
    setOpen(false);
    setModal(type);
  };

  const items = [
    {
      key: "bug" as const,
      icon: "🐛",
      label: "Report Bug",
      desc: "Something broke",
      accent: "hover:bg-orange-500/10 group-hover:border-orange-500/20",
      iconBg: "bg-orange-500/10 border-orange-500/20",
    },
    {
      key: "feature" as const,
      icon: "💡",
      label: "Request Feature",
      desc: "Have an idea?",
      accent: "hover:bg-violet-500/10 group-hover:border-violet-500/20",
      iconBg: "bg-violet-500/10 border-violet-500/20",
    },
    {
      key: "general" as const,
      icon: "💬",
      label: "Give Feedback",
      desc: "Share your thoughts",
      accent: "hover:bg-emerald-500/10",
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Dropdown menu */}
        {open && (
          <div className="mb-1 w-72 rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #1e2340 0%, #131627 100%)" }}>
            {/* Title bar */}
            <div className="px-5 py-3.5 border-b border-white/5">
              <p className="text-xs font-black uppercase tracking-widest text-white/30">Proofi Support</p>
            </div>

            <div className="p-2 space-y-0.5">
              {items.map((item) => (
                <button key={item.key} onClick={() => openModal(item.key)}
                  className={`group w-full flex items-center gap-4 px-3 py-3 rounded-2xl transition-all text-left ${item.accent}`}>
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl flex-shrink-0 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{item.label}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
                  </div>
                  <svg className="w-4 h-4 text-white/20 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20">Response within 24 hrs · proofi.ai26@gmail.com</p>
            </div>
          </div>
        )}

        {/* FAB button */}
        <button onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group relative ${
            open
              ? "bg-[#1e2340] border-2 border-white/20 scale-95"
              : "bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 hover:scale-110 active:scale-95 shadow-violet-500/40"
          }`}
          aria-label="Feedback">
          {!open && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#131627] animate-pulse" />
          )}
          {open ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          )}
        </button>
      </div>

      {/* Modals */}
      <BugReportModal isOpen={modal === "bug"} onClose={() => setModal(null)} />
      <FeatureRequestModal isOpen={modal === "feature"} onClose={() => setModal(null)} />
      <GeneralFeedbackModal isOpen={modal === "general"} onClose={() => setModal(null)} />
    </>
  );
}
