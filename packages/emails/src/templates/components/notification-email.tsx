import { EmailLayout } from "./email-layout";
import { Button, Link, Text } from "./styled-components";
import { getDomain } from "./utils";

export interface NotificationBaseProps {
  name: string;
  title: string;
  pollUrl: string;
  disableNotificationsUrl: string;
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
}: React.PropsWithChildren<NotificationEmailProps>) => {
  return (
    <EmailLayout
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
        <Button href={pollUrl}>View on {getDomain()}</Button>
      </Text>
    </EmailLayout>
  );
};

export default NotificationEmail;
