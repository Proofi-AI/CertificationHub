"use client";

import { useEffect } from "react";
import type { User } from "@prisma/client";
import ProfilePanel from "./ProfilePanel";

interface Props {
  initialProfile: User;
  onClose: () => void;
}

export default function SettingsModal({ initialProfile, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <ProfilePanel initialProfile={initialProfile} onClose={onClose} />
      </div>
    </div>
  );
}
