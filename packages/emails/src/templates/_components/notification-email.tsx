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
  name,
  pollUrl,
  disableNotificationsUrl,
  preview,
  children,
  ctx,
}: React.PropsWithChildren<NotificationEmailProps>) => {
  const { domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      recipientName={name}
      footNote={
        <>
          If you would like to stop receiving updates you can{" "}
          <Link className="whitespace-nowrap" href={disableNotificationsUrl}>
            turn notifications off
          </Link>
          .
        </>
      }
      preview={preview}
    >
      {children}
      <Text>
        <Button href={pollUrl}>View on {domain}</Button>
      </Text>
    </EmailLayout>
  );
};

export default NotificationEmail;
