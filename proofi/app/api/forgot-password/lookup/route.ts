import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Shuffle an array using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        hasSetSecurity: true,
        securityQ1: true,
        securityQ2: true,
        securityQ3: true,
      },
    });

    if (!user) {
      // Don't reveal whether the email exists
      return NextResponse.json({ status: "not_found" });
    }

    if (!user.hasSetSecurity) {
      return NextResponse.json({ status: "no_security" });
    }

    // Return 3 questions in a random order so we can cycle through them on wrong attempts
    const questions = shuffle([
      user.securityQ1!,
      user.securityQ2!,
      user.securityQ3!,
    ]);

    return NextResponse.json({
      status: "found",
      questions,
    });
  } catch (err) {
    console.error("[forgot-password/lookup] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
