import { Suspense } from "react";
import { VerifyEmailForm } from "./VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-white rounded-lg" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
