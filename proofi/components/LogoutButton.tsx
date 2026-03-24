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
      className="text-sm font-medium transition-all px-3 py-2 rounded-xl
        text-slate-500 hover:text-slate-800 hover:bg-black/[0.06]
        dark:text-white/60 dark:hover:text-white dark:hover:bg-white/[0.08]"
    >
      Sign out
    </button>
  );
}
