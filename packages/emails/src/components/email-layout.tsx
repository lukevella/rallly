import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
} from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailContext } from "../types";
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
          <Section style={{ marginTop: 32 }}>
            <Text light={true}>
              <Trans
                i18n={ctx.i18n}
                t={ctx.t}
                i18nKey="common_poweredBy"
                ns="emails"
                defaults="Powered by <a>{{domain}}</a>"
                values={{ domain: "rallly.co" }}
                components={{
                  a: (
                    <Link href="https://rallly.co?utm_source=email&utm_medium=transactional" />
                  ),
                }}
              />
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
