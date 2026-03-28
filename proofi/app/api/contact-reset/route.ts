import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// IMPORTANT: CONTACT_EMAIL_PASS must be a Gmail App Password, NOT your regular Gmail password.
// Generate one at: Google Account → Security → 2-Step Verification → App Passwords
// Regular Gmail passwords will NOT work with SMTP.

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.CONTACT_EMAIL_USER,
    pass: process.env.CONTACT_EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, message } = await req.json();

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const userEmail = email.trim();
    const userMessage = message.trim();

    await transporter.sendMail({
      from: process.env.CONTACT_EMAIL_USER,
      to: "proofiai26@gmail.com",
      subject: `Proofi AI — Password Reset Request from ${userEmail}`,
      text: `
Password reset request received.

From: ${userEmail}
Message: ${userMessage}

Please look up this user in the Supabase dashboard and trigger a manual reset.
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[contact-reset] error:", err);
    return NextResponse.json(
      { error: "Failed to send email." },
      { status: 500 }
    );
  }
}
