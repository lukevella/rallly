import { EmailLayout } from "./email-layout";
import { Button, Card, Link, Text } from "./styled-components";
import { getDomain } from "./utils";

export interface NotificationBaseProps {
  name: string;
  title: string;
  pollUrl: string;
  unsubscribeUrl: string;
}

export interface NotificationEmailProps extends NotificationBaseProps {
  preview: string;
}

export const NotificationEmail = ({
  name,
  pollUrl,
  unsubscribeUrl,
  preview,
  children,
}: React.PropsWithChildren<NotificationEmailProps>) => {
  return (
    <EmailLayout
      recipientName={name}
      footNote={
        <>
          If you would like to stop receiving updates you can{" "}
          <Link className="whitespace-nowrap" href={unsubscribeUrl}>
            turn notifications off
          </Link>
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
