import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/is-admin";
import AdminFeedbackClient from "@/components/feedback/AdminFeedbackClient";

export const metadata = {
  title: "Admin Feedback Inbox | Proofi AI",
  description: "Review and manage customer feedback",
};

export default async function AdminFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const admin = await isAdmin(user.email);

  if (!admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-white/50 max-w-sm">
          You need admin privileges to access this page. Contact <strong>proofi.ai26@gmail.com</strong> to request access.
        </p>
      </div>
    );
  }

  return <AdminFeedbackClient />;
}
