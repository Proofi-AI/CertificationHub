import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#f4f4f5", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            maxWidth: "560px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "40px",
          }}
        >
          <Text style={{ fontSize: "20px", fontWeight: "bold", color: "#111827", marginBottom: "4px" }}>
            CertificationHub
          </Text>
          <Hr style={{ borderColor: "#e5e7eb", margin: "16px 0 24px" }} />
          <Section>{children}</Section>
          <Hr style={{ borderColor: "#e5e7eb", margin: "24px 0 16px" }} />
          <Text style={{ fontSize: "12px", color: "#9ca3af" }}>
            © {new Date().getFullYear()} CertificationHub. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
