import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
} from "@react-email/components";

import { useEmailContext } from "./email-context";
import { fontFamily, Section, Text } from "./styled-components";

export interface EmailLayoutProps {
  preview: string;
  recipientName: string;
  footNote?: React.ReactNode;
}

const containerStyles = {
  maxWidth: "600px",
  margin: "0 auto",
  background: "white",
  fontFamily,
  padding: 16,
  border: "1px solid #E2E8F0",
  borderRadius: 5,
};

const sectionStyles = {
  marginTop: "16px",
  marginBottom: "16px",
};

const linkStyles = {
  color: "#64748B",
  marginRight: "8px",
};

export const EmailLayout = ({
  preview,
  recipientName = "Guest",
  children,
  footNote,
}: React.PropsWithChildren<EmailLayoutProps>) => {
  const { logoUrl, baseUrl } = useEmailContext();
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#F3F4F6", padding: "16px" }}>
        <Container style={containerStyles}>
          <Img src={logoUrl} alt="Rallly" width={128} />
          <Section style={sectionStyles}>
            <Text>Hi {recipientName},</Text>
            {children}
            {footNote ? (
              <Text
                style={{
                  color: "#64748B",
                  fontFamily,
                  paddingTop: 16,
                  marginTop: 32,
                  borderTop: "1px solid #e2e8f0",
                }}
              >
                {footNote}
              </Text>
            ) : null}
          </Section>
          <Section style={{ ...sectionStyles, fontSize: 14, marginBottom: 0 }}>
            <Link style={linkStyles} href={baseUrl}>
              Home
            </Link>
            <span>&nbsp;&bull;&nbsp;</span>
            <Link style={linkStyles} href="https://twitter.com/ralllyco">
              Twitter
            </Link>
            <span>&nbsp;&bull;&nbsp;</span>
            <Link style={linkStyles} href="https://github.com/lukevella/rallly">
              Github
            </Link>
            <span>&nbsp;&bull;&nbsp;</span>
            <Link
              style={linkStyles}
              href="https://www.paypal.com/donate/?hosted_button_id=7QXP2CUBLY88E"
            >
              Donate
            </Link>
            <span>&nbsp;&bull;&nbsp;</span>
            <Link
              style={linkStyles}
              href={`mailto:${process.env["SUPPORT_EMAIL"]}`}
            >
              Contact
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
