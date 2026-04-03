"use client";

interface Props {
  activeTab: "certificates" | "badges";
  onTabChange: (tab: "certificates" | "badges") => void;
  badgeCount: number;
}

export default function DashboardTabs({ activeTab, onTabChange, badgeCount }: Props) {
  return (
    <div className="flex items-center gap-1 pb-0">
      <button
        onClick={() => onTabChange("certificates")}
        className={`relative flex items-center gap-2 px-1 pb-3 text-sm font-semibold transition-all duration-200 ${
          activeTab === "certificates"
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"
        }`}
      >
        Certificates
        {activeTab === "certificates" && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-violet-600 dark:bg-violet-400" />
        )}
      </button>

      <button
        onClick={() => onTabChange("badges")}
        className={`relative flex items-center gap-2 px-1 pb-3 ml-6 text-sm font-semibold transition-all duration-200 ${
          activeTab === "badges"
            ? "text-slate-900 dark:text-white"
            : "text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/60"
        }`}
      >
        Badges
        {badgeCount > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{
              background: activeTab === "badges" ? "rgba(124,58,237,0.15)" : "rgba(124,58,237,0.08)",
              color: activeTab === "badges" ? "#7c3aed" : "#a78bfa",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            {badgeCount}
          </span>
        )}
        {activeTab === "badges" && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-violet-600 dark:bg-violet-400" />
        )}
      </button>
    </div>
  );
}
