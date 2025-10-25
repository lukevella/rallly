import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Card,
  Domain,
  Heading,
  Link,
  Text,
  trackingWide,
} from "../components/styled-components";
import type { EmailContext } from "../types";

interface RegisterEmailProps {
  code: string;
  ctx: EmailContext;
}

export const RegisterEmail = ({ code, ctx }: RegisterEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("register_preview", {
        ns: "emails",
        defaultValue: "Your 6-digit code is: {code}",
        code,
      })}
    >
      <Heading>
        {ctx.t("register_heading", {
          defaultValue: "Verify your email address",
          ns: "emails",
        })}
      </Heading>
      <Text>
        {ctx.t("register_text", {
          defaultValue:
            "Please use the following 6-digit verification code to verify your email",
          ns: "emails",
        })}
      </Text>
      <Card style={{ textAlign: "center" }}>
        <Text
          style={{
            ...trackingWide,
            textAlign: "center",
            fontSize: "32px",
            fontWeight: "bold",
          }}
          id="code"
        >
          {code}
        </Text>
        <Text style={{ textAlign: "center" }} light={true}>
          {ctx.t("register_codeValid", {
            defaultValue: "This code is valid for 15 minutes",
            ns: "emails",
          })}
        </Text>
      </Card>
      <Section>
        <Text light={true}>
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="login_content2"
            defaults="You're receiving this email because a request was made to login to <domain />. If this wasn't you contact <a>{supportEmail}</a>."
            values={{ supportEmail: ctx.supportEmail }}
            components={{
              domain: <Domain ctx={ctx} />,
              a: <Link href={`mailto:${ctx.supportEmail}`} />,
            }}
            ns="emails"
          />
        </Text>
      </Section>
    </EmailLayout>
  );
};

RegisterEmail.getSubject = (_props: RegisterEmailProps, ctx: EmailContext) => {
  return ctx.t("register_subject", {
    defaultValue: "Please verify your email address",
    ns: "emails",
  });
};

export default RegisterEmail;
