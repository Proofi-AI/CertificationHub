"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleCertificateVisibility } from "@/actions/certificate.actions";
import { toast } from "sonner";

interface VisibilityToggleProps {
  certId: string;
  initialValue: boolean;
}

export function VisibilityToggle({ certId, initialValue }: VisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    setIsPublic(checked);
    startTransition(async () => {
      const result = await toggleCertificateVisibility(certId);
      if (!result.success) {
        setIsPublic(!checked);
        toast.error(result.error);
      } else {
        toast.success(checked ? "Certificate made public" : "Certificate made private");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id={`visibility-${certId}`}
        checked={isPublic}
        onCheckedChange={handleToggle}
        disabled={isPending}
      />
      <Label htmlFor={`visibility-${certId}`} className="text-sm text-gray-600">
        {isPublic ? "Public" : "Private"}
      </Label>
    </div>
  );
}
