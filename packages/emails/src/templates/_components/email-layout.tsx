import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
} from "@react-email/components";

import { EmailContext } from "./email-context";
import { fontFamily } from "./styled-components";

export interface EmailLayoutProps {
  preview: string;
  footNote?: React.ReactNode;
  ctx: EmailContext;
}

const containerStyles = {
  maxWidth: "500px",
  margin: "0 auto",
  background: "white",
  fontFamily,
  padding: "24px",
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
            width="128"
            height="24"
            style={{
              marginBottom: 32,
            }}
            alt="Rallly Logo"
          />
          {children}
        </Container>
      </Body>
    </Html>
  );
};
