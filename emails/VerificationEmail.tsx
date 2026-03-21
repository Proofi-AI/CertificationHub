import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";

interface VerificationEmailProps {
  name: string;
  verifyUrl: string;
}

export function VerificationEmail({ name, verifyUrl }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your CertificationHub email address">
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Hi {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Thanks for signing up for CertificationHub! Please verify your email address by clicking
        the button below. This link expires in 24 hours.
      </Text>
      <Button
        href={verifyUrl}
        style={{
          backgroundColor: "#2563eb",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "600",
          textDecoration: "none",
          display: "inline-block",
          margin: "16px 0",
        }}
      >
        Verify Email Address
      </Button>
      <Text style={{ fontSize: "14px", color: "#6b7280" }}>
        If you did not create an account, you can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

export default VerificationEmail;
