"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { resendVerificationEmail } from "@/actions/auth.actions";
import { toast } from "sonner";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const error = searchParams.get("error");
  const [isPending, startTransition] = useTransition();

  const errorMessages: Record<string, string> = {
    "missing-token": "Verification link is missing. Please request a new one.",
    "invalid-token": "Verification link is invalid. Please request a new one.",
    "expired-token": "Verification link has expired. Please request a new one.",
  };

  function handleResend() {
    if (!email) return;
    startTransition(async () => {
      const result = await resendVerificationEmail(email);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Verification email sent! Check your inbox.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          {email
            ? `We sent a verification link to ${email}`
            : "We sent you a verification link"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessages[error] ?? "An error occurred. Please try again."}
          </div>
        )}
        <p className="text-sm text-gray-600">
          Click the link in your email to verify your account. The link expires in 24 hours.
        </p>
        {email && (
          <Button variant="outline" onClick={handleResend} disabled={isPending}>
            {isPending ? "Sending..." : "Resend verification email"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
