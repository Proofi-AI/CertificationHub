import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificateForm } from "@/components/certificates/CertificateForm";

export default function NewCertificatePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add Certificate</CardTitle>
          <CardDescription>
            Upload a certificate file or enter the details manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CertificateForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
