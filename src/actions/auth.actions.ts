"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { registerSchema } from "@/schemas/auth.schema";
import type { ActionResult } from "@/types";
import { createElement } from "react";
import { VerificationEmail } from "../../emails/VerificationEmail";

export async function registerUser(formData: FormData): Promise<ActionResult<{ email: string }>> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
  });

  await sendVerificationEmail(user.id, email, name);

  return { success: true, data: { email } };
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
    subject: "Verify your CertificationHub email",
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

  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      userId: user.id,
      type: "EMAIL_VERIFICATION",
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    } as Parameters<typeof prisma.verificationToken.findFirst>[0]["where"],
  });

  if (recentToken) {
    return { success: false, error: "Please wait 5 minutes before requesting another verification email." };
  }

  await sendVerificationEmail(user.id, user.email, user.name);
  return { success: true, data: undefined };
}
