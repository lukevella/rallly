import { Section } from "@react-email/components";
import { Trans } from "react-i18next/TransWithoutContext";

import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Card,
  Domain,
  Heading,
  Link,
  Text,
  trackingWide,
} from "../components/styled-components";
import type { EmailContext } from "../types";

interface LoginEmailProps {
  code: string;
  magicLink: string;
  ctx: EmailContext;
}

export const LoginEmail = ({ code, magicLink, ctx }: LoginEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("login_preview", {
        defaultValue: "Use this link to log in on this device.",
        ns: "emails",
      })}
    >
      <Heading>
        {ctx.t("login_heading", { defaultValue: "Login", ns: "emails" })}
      </Heading>
      <Text>
        {ctx.t("login_content", {
          defaultValue: "Enter this one-time 6-digit verification code:",
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
          {ctx.t("login_codeValid", {
            defaultValue: "This code is valid for 15 minutes",
            ns: "emails",
          })}
        </Text>
      </Card>
      <Section style={{ marginBottom: 32 }}>
        <Button href={magicLink} id="magicLink">
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="login_button"
            defaults="Log in to {{domain}}"
            values={{ domain: ctx.domain }}
            ns="emails"
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="login_content2"
          defaults="You're receiving this email because a request was made to login to <domain />. If this wasn't you contact <a>{{supportEmail}}</a>."
          values={{ supportEmail: ctx.supportEmail }}
          components={{
            domain: <Domain ctx={ctx} />,
            a: <Link href={`mailto:${ctx.supportEmail}`} />,
          }}
          ns="emails"
        />
      </Text>
    </EmailLayout>
  );
};

LoginEmail.getSubject = (props: LoginEmailProps, ctx: EmailContext) => {
  return ctx.t("login_subject", {
    defaultValue: "{{code}} is your 6-digit code",
    code: props.code,
    ns: "emails",
  });
};

export default LoginEmail;
