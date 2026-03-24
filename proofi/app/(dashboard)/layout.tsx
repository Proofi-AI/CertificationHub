import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ThemeProvider from "@/components/dashboard/ThemeProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <ThemeProvider>{children}</ThemeProvider>;
}
