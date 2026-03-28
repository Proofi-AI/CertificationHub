import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, questionText, answer } = await req.json();

    if (!email || !questionText || !answer) {
      return NextResponse.json(
        { error: "Email, question and answer are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        hasSetSecurity: true,
        securityQ1: true,
        securityA1: true,
        securityQ2: true,
        securityA2: true,
        securityQ3: true,
        securityA3: true,
      },
    });

    if (!user || !user.hasSetSecurity) {
      return NextResponse.json({ correct: false });
    }

    // Find which slot matches the asked question
    let storedAnswer: string | null = null;
    if (user.securityQ1 === questionText) storedAnswer = user.securityA1;
    else if (user.securityQ2 === questionText) storedAnswer = user.securityA2;
    else if (user.securityQ3 === questionText) storedAnswer = user.securityA3;

    if (!storedAnswer) {
      return NextResponse.json({ correct: false });
    }

    const normalised = answer.trim().toLowerCase();
    const correct = normalised === storedAnswer;

    if (correct) {
      return NextResponse.json({ correct: true, userId: user.id });
    }

    return NextResponse.json({ correct: false });
  } catch (err) {
    console.error("[forgot-password/verify] error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
