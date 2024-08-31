import { Section } from "@react-email/components";

import { EmailContext } from "../components/email-context";
import { EmailLayout } from "../components/email-layout";
import {
  Button,
  Card,
  Domain,
  Heading,
  Text,
  trackingWide,
} from "../components/styled-components";

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
      })}
    >
      <Heading>{ctx.t("login_heading", { defaultValue: "Login" })}</Heading>
      <Text>
        {ctx.t("login_content", {
          defaultValue: "Enter this one-time 6-digit verification code:",
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
          })}
        </Text>
      </Card>
      <Section style={{ marginBottom: 32 }}>
        <Button href={magicLink} id="magicLink">
          <Trans
            i18n={ctx.i18n}
            t={ctx.t}
            i18nKey="login_button"
            defaults="Log in to {domain}"
            values={{ domain: ctx.domain }}
          />
        </Button>
      </Section>
      <Text light>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="login_content2"
          defaults="You're receiving this email because a request was made to login to <domain />. If this wasn't you contact <a>{supportEmail}</a>."
          values={{ supportEmail: ctx.supportEmail }}
          components={{
            domain: <Domain ctx={ctx} />,
            a: <a href={`mailto:${ctx.supportEmail}`} />,
          }}
        />
      </Text>
    </EmailLayout>
  );
};

LoginEmail.getSubject = (props: LoginEmailProps, ctx: EmailContext) => {
  return ctx.t("login_subject", {
    defaultValue: "{{code}} is your 6-digit code",
    code: props.code,
  });
};

export default LoginEmail;
