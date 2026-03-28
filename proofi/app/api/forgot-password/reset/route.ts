import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, email, newPassword } = await req.json();

    if (!userId || !email || !newPassword) {
      return NextResponse.json(
        { error: "userId, email and newPassword are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    // Re-verify that the userId matches the email and has security set up
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, hasSetSecurity: true },
    });

    if (
      !user ||
      user.email.toLowerCase() !== email.trim().toLowerCase() ||
      !user.hasSetSecurity
    ) {
      return NextResponse.json(
        { error: "Invalid reset request." },
        { status: 400 }
      );
    }

    // Use the Supabase admin client to update the password server-side
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error("[forgot-password/reset] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password/reset] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
