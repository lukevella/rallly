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
          Wenn Du nicht mehr über Neuigkeiten informiert werden möchtest, kannst
          Du die Benachrichtigungen in den Einstellungen{" "}
          <Link className="whitespace-nowrap" href={disableNotificationsUrl}>
            deaktivieren
          </Link>
          .
        </>
      }
      preview={preview}
    >
      {children}
      <Text>
        <Button href={pollUrl}>Du findest die Umfrage unter {domain}</Button>
      </Text>
    </EmailLayout>
  );
};

export default NotificationEmail;
