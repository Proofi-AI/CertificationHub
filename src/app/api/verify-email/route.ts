import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify-email?error=missing-token", req.url));
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return NextResponse.redirect(new URL("/verify-email?error=invalid-token", req.url));
  }

  if (record.usedAt) {
    return NextResponse.redirect(new URL("/login?verified=already", req.url));
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/verify-email?error=expired-token", req.url));
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.update({
      where: { token },
      data: { usedAt: new Date() },
    }),
  ]);

  // Redirect to sign-out first so the stale JWT (which has emailVerified=null)
  // is cleared. NextAuth will redirect to /login after signing out.
  const signOutUrl = new URL("/api/auth/signout", req.url);
  signOutUrl.searchParams.set("callbackUrl", "/login?verified=true");
  return NextResponse.redirect(signOutUrl);
}
