import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
} from "@react-email/components";

import { EmailContext } from "./email-context";
import { darkTextColor, fontFamily, Link, Text } from "./styled-components";

export interface EmailLayoutProps {
  preview: string;
  ctx: EmailContext;
}

const containerStyles = {
  maxWidth: "480px",
  margin: "0 auto",
  background: "white",
  fontFamily,
  padding: "32px 8px",
  color: darkTextColor,
};

export const EmailLayout = ({
  preview,
  children,
  ctx,
}: React.PropsWithChildren<EmailLayoutProps>) => {
  const { logoUrl } = ctx;
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: "#FFFFFF" }}>
        <Container style={containerStyles}>
          <Img
            src={logoUrl}
            width="32"
            height="32"
            style={{
              marginBottom: 32,
            }}
            alt="Rallly Logo"
          />
          {children}
          <Section style={{ marginTop: 32, textAlign: "center" }}>
            <Text light={true}>
              Powered by{" "}
              <Link href="https://rallly.co?utm_source=email&utm_medium=transactional">
                rallly.co
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
