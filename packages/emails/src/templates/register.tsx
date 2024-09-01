import { Section } from "@react-email/section";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Card,
  Domain,
  Heading,
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
        defaultValue: "Your 6-digit code is: {{code}}",
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
            i18nKey="register_footer"
            ns="emails"
            values={{ domain: ctx.domain }}
            components={{
              domain: <Domain ctx={ctx} />,
            }}
            defaults="You're receiving this email because a request was made to register an account on <domain />. If this wasn't you, please ignore this email."
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
