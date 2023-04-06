import { absoluteUrl } from "@rallly/utils";
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
} from "@react-email/components";

import { fontFamily, Section, Text } from "./styled-components";

interface EmailLayoutProps {
  preview: string;
  recipientName: string;
  footNote?: React.ReactNode;
}

const containerStyles = {
  maxWidth: "600px",
  margin: "0 auto",
  fontFamily,
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
  const firstName = recipientName.split(" ")[0];
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "white", padding: "16px" }}>
        <Container style={containerStyles}>
          <Img src={absoluteUrl("/logo.png")} alt="Rallly" width={128} />
          <Section style={sectionStyles}>
            <Text>Hi {firstName},</Text>
            {children}
            {footNote ? (
              <Text style={{ color: "#64748B", fontFamily }}>{footNote}</Text>
            ) : null}
          </Section>
          <Section style={{ ...sectionStyles, fontSize: 14 }}>
            <Link style={linkStyles} href={absoluteUrl()}>
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
              href={`mailto:${process.env.SUPPORT_EMAIL}`}
            >
              Contact
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
