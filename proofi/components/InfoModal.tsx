"use client";

interface Props {
  title: string;
  message: string;
  onClose: () => void;
}

export default function InfoModal({ title, message, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{ background: "var(--surface)", border: "1px solid var(--border-hover)" }}
      >
        {/* Icon */}
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>

        <h3 className="text-base font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm mb-6 text-slate-500 dark:text-white/55">{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
            text-slate-600 dark:text-white/70 bg-black/[0.04] hover:bg-black/[0.08] border border-black/[0.08] hover:border-black/[0.14]
            dark:bg-white/[0.06] dark:hover:bg-white/[0.10] dark:border-white/[0.11] dark:hover:border-white/[0.18]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
