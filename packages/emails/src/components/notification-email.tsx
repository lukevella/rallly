import { Section } from "@react-email/section";

import { EmailContext } from "./email-context";
import { EmailLayout } from "./email-layout";
import { Button, Link, Text } from "./styled-components";

export interface NotificationBaseProps {
  name: string;
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
        <Button href={pollUrl}>View on {domain}</Button>
      </Section>
      <Text light={true}>
        If you would like to stop receiving updates you can{" "}
        <Link className="whitespace-nowrap" href={disableNotificationsUrl}>
          turn notifications off
        </Link>
        .
      </Text>
    </EmailLayout>
  );
};

export default NotificationEmail;
