import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isAdmin, DEFAULT_ADMIN_EMAIL } from "@/lib/is-admin";

// GET — list all admin users
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !(await isAdmin(user.email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all users with isAdmin = true from the database
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { email: true, name: true, createdAt: true },
    });

    // Always include the default admin even if not in DB yet
    const defaultInList = adminUsers.some(u => u.email === DEFAULT_ADMIN_EMAIL);
    const result = defaultInList
      ? adminUsers
      : [{ email: DEFAULT_ADMIN_EMAIL, name: "Default Admin", createdAt: new Date() }, ...adminUsers];

    return Response.json({ admins: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// POST — grant admin to an email
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !(await isAdmin(user.email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email) return Response.json({ error: "Email is required" }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      return Response.json({ error: "No account found with that email address. The user must sign up first." }, { status: 404 });
    }

    await prisma.user.update({ where: { email }, data: { isAdmin: true } });
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}

// DELETE — revoke admin
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || !(await isAdmin(user.email))) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email } = await req.json();
    if (email === DEFAULT_ADMIN_EMAIL) {
      return Response.json({ error: "Cannot remove the default admin." }, { status: 400 });
    }

    await prisma.user.update({ where: { email }, data: { isAdmin: false } });
    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
