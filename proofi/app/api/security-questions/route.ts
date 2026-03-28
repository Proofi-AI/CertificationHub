import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, q1, a1, q2, a2, q3, a3 } = body;

    // Ensure the authenticated user can only update their own record
    if (userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate all fields are present
    if (!q1 || !a1 || !q2 || !a2 || !q3 || !a3) {
      return NextResponse.json(
        { error: "All three questions and answers are required." },
        { status: 400 }
      );
    }

    // Validate no duplicate questions
    if (q1 === q2 || q1 === q3 || q2 === q3) {
      return NextResponse.json(
        { error: "Each security question must be unique." },
        { status: 400 }
      );
    }

    // Validate answer lengths
    if (a1.length < 2 || a2.length < 2 || a3.length < 2) {
      return NextResponse.json(
        { error: "Each answer must be at least 2 characters." },
        { status: 400 }
      );
    }

    // Store answers as lowercase trimmed strings for case-insensitive matching
    await prisma.user.update({
      where: { id: userId },
      data: {
        securityQ1: q1,
        securityA1: a1.trim().toLowerCase(),
        securityQ2: q2,
        securityA2: a2.trim().toLowerCase(),
        securityQ3: q3,
        securityA3: a3.trim().toLowerCase(),
        hasSetSecurity: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[security-questions] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
