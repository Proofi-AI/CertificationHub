"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      title="Sign out"
      className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-2 sm:px-3 py-2 rounded-xl
        text-slate-500 hover:text-slate-800 hover:bg-black/[0.06]
        dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08]"
    >
      <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
      </svg>
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
