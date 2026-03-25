"use client";

import { useState } from "react";
import type { Certificate } from "@prisma/client";
import type { UserFeatures } from "@/lib/features";
import CertificatesPanel from "./CertificatesPanel";
import ActivityPanel from "./ActivityPanel";

interface Props {
  initialCertificates: Certificate[];
  features: UserFeatures;
}

export default function DashboardClient({ initialCertificates, features }: Props) {
  const [certificates, setCertificates] = useState<Certificate[]>(initialCertificates);
  const [externalEdit, setExternalEdit] = useState<Certificate | null>(null);

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
      {/* Left: certificates (76%) */}
      <div className="w-full lg:flex-[0_0_75%] lg:min-w-0">
        <CertificatesPanel
          initialCertificates={certificates}
          features={features}
          onCertificatesChange={setCertificates}
          externalEdit={externalEdit}
          onExternalEditDone={() => setExternalEdit(null)}
        />
      </div>

      {/* Right: activity (22%) */}
      <div className="w-full lg:flex-[0_0_22%] lg:min-w-0 lg:sticky lg:top-20">
        <ActivityPanel
          certificates={certificates}
          onEditCertificate={(cert) => setExternalEdit(cert)}
        />
      </div>
    </div>
  );
}
