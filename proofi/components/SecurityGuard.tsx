"use client";

import { useState } from "react";
import SecurityQuestionsModal from "./SecurityQuestionsModal";

interface Props {
  userId: string;
  hasSetSecurity: boolean;
  children: React.ReactNode;
}

export default function SecurityGuard({ userId, hasSetSecurity, children }: Props) {
  const [securityComplete, setSecurityComplete] = useState(hasSetSecurity);

  return (
    <>
      {children}
      {!securityComplete && (
        <SecurityQuestionsModal
          userId={userId}
          onComplete={() => setSecurityComplete(true)}
        />
      )}
    </>
  );
}
