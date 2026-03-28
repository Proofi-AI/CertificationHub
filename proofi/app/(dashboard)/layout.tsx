import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ThemeProvider from "@/components/dashboard/ThemeProvider";
import SecurityGuard from "@/components/SecurityGuard";
import { ensureUserRecord } from "@/lib/auth/ensureUserRecord";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await ensureUserRecord(user);

  return (
    <ThemeProvider>
      <SecurityGuard userId={dbUser.id} hasSetSecurity={dbUser.hasSetSecurity}>
        {children}
      </SecurityGuard>
    </ThemeProvider>
  );
}
