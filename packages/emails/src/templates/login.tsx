import { Section } from "@react-email/components";

import { defaultEmailContext, EmailContext } from "../components/email-context";
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

export const LoginEmail = ({
  code = "123456",
  magicLink = "https://rallly.co",
  ctx = defaultEmailContext,
}: LoginEmailProps) => {
  return (
    <EmailLayout
      ctx={ctx}
      preview={ctx.t("login_preview", {
        defaultValue: "Use this link to log in on this device.",
      })}
    >
      <Heading>Login</Heading>
      <Text>Enter this one-time 6-digit verification code:</Text>
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
          This code is valid for 15 minutes
        </Text>
      </Card>
      <Section style={{ marginBottom: 32 }}>
        <Button href={magicLink} id="magicLink">
          Log in to {ctx.domain}
        </Button>
      </Section>
      <Text light>
        You&apos;re receiving this email because a request was made to login to{" "}
        <Domain ctx={ctx} />. If this wasn&apos;t you contact{" "}
        <a href={`mailto:${ctx.supportEmail}`}>{ctx.supportEmail}</a>.
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
