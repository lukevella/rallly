import { Section } from "@react-email/section";
import { Trans } from "react-i18next/TransWithoutContext";

import type { EmailContext } from "../types";
import { EmailLayout } from "./email-layout";
import { Button, Link, Text } from "./styled-components";

export interface NotificationBaseProps {
  title: string;
  pollUrl: string;
  disableNotificationsUrl: string;
  ctx: EmailContext;
}

export interface NotificationEmailProps extends NotificationBaseProps {
  preview: string;
}

export const NotificationEmail = ({
  pollUrl,
  disableNotificationsUrl,
  preview,
  children,
  ctx,
}: React.PropsWithChildren<NotificationEmailProps>) => {
  const { domain } = ctx;
  return (
    <EmailLayout ctx={ctx} preview={preview}>
      {children}
      <Section style={{ marginTop: 32, marginBottom: 32 }}>
        <Button href={pollUrl}>
          {ctx.t("common_viewOn", {
            ns: "emails",
            defaultValue: "View on {{domain}}",
            domain,
          })}
        </Button>
      </Section>
      <Text light={true}>
        <Trans
          i18n={ctx.i18n}
          t={ctx.t}
          i18nKey="common_disableNotifications"
          ns="emails"
          defaults="If you would like to stop receiving updates you can <a>turn notifications off</a>."
          components={{
            a: (
              <Link
                className="whitespace-nowrap"
                href={disableNotificationsUrl}
              />
            ),
          }}
        />
      </Text>
    </EmailLayout>
  );
};

export default NotificationEmail;
