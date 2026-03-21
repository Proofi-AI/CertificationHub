"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { registerSchema } from "@/schemas/auth.schema";
import type { ActionResult } from "@/types";
import { createElement } from "react";
import { VerificationEmail } from "../../emails/VerificationEmail";

export async function registerUser(formData: FormData): Promise<ActionResult<{ email: string; password: string }>> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  // Send verification email in the background — don't block sign-in
  sendVerificationEmail(user.id, email, null).catch((err) =>
    console.error("[register] Failed to send verification email:", err)
  );

  return { success: true, data: { email, password } };
}

export async function sendVerificationEmail(
  userId: string,
  email: string,
  name: string | null
): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.verificationToken.deleteMany({
    where: { userId, type: "EMAIL_VERIFICATION" },
  });

  await prisma.verificationToken.create({
    data: { token, userId, type: "EMAIL_VERIFICATION", expiresAt },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your proofi.ai email",
    template: createElement(VerificationEmail, {
      name: name ?? "there",
      verifyUrl,
    }),
  });
}

export async function resendVerificationEmail(email: string): Promise<ActionResult> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false, error: "User not found." };
  if (user.emailVerified) return { success: false, error: "Email is already verified." };

  // Rate limit: check if a token was created in the last 5 minutes using expiresAt
  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      expiresAt: { gte: new Date(Date.now() + 23 * 60 * 60 * 1000) }, // created < 1hr ago
    },
  });

  if (recentToken) {
    return { success: false, error: "Please wait 5 minutes before requesting another verification email." };
  }

  await sendVerificationEmail(user.id, user.email, user.name);
  return { success: true, data: undefined };
}
