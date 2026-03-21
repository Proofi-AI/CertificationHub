import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./components/EmailLayout";
import { format } from "date-fns";

interface ExpiryAlertEmailProps {
  name: string;
  certName: string;
  issuer: string;
  daysBefore: number;
  expiryDate: string;
  certUrl: string;
}

export function ExpiryAlertEmail({
  name,
  certName,
  issuer,
  daysBefore,
  expiryDate,
  certUrl,
}: ExpiryAlertEmailProps) {
  const formattedDate = format(new Date(expiryDate), "MMMM d, yyyy");
  const urgency = daysBefore <= 7 ? "urgent" : daysBefore <= 30 ? "soon" : "upcoming";

  return (
    <EmailLayout preview={`Your certificate "${certName}" expires in ${daysBefore} days`}>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Hi {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        This is a{urgency === "urgent" ? "n urgent" : ""} reminder that your certificate is expiring{" "}
        {urgency === "upcoming" ? "soon" : `in ${daysBefore} days`}.
      </Text>
      <div
        style={{
          backgroundColor: daysBefore <= 7 ? "#fef2f2" : daysBefore <= 30 ? "#fffbeb" : "#eff6ff",
          border: `1px solid ${daysBefore <= 7 ? "#fecaca" : daysBefore <= 30 ? "#fde68a" : "#bfdbfe"}`,
          borderRadius: "8px",
          padding: "16px",
          margin: "16px 0",
        }}
      >
        <Text style={{ margin: 0, fontWeight: "600", color: "#111827" }}>{certName}</Text>
        <Text style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "14px" }}>
          Issued by {issuer}
        </Text>
        <Text style={{ margin: "8px 0 0", color: "#374151", fontSize: "14px" }}>
          Expires: <strong>{formattedDate}</strong>
        </Text>
      </div>
      <Button
        href={certUrl}
        style={{
          backgroundColor: "#2563eb",
          color: "#ffffff",
          padding: "12px 24px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "600",
          textDecoration: "none",
          display: "inline-block",
          margin: "8px 0 16px",
        }}
      >
        View Certificate
      </Button>
      <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
        You can manage notification preferences in your account settings.
      </Text>
    </EmailLayout>
  );
}

export default ExpiryAlertEmail;
