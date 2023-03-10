import { EmailLayout } from "./email-layout";
import { Link, Section } from "./styled-components";

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
  title,
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
          You&apos;re receiving this email because notifications are enabled for{" "}
          <strong>{title}</strong>. If you want to stop receiving emails about
          this event you can{" "}
          <Link className="whitespace-nowrap" href={unsubscribeUrl}>
            turn notifications off
          </Link>
          .
        </>
      }
      preview={preview}
    >
      {children}
      <Section>
        <Link href={pollUrl}>Go to poll &rarr;</Link>
      </Section>
    </EmailLayout>
  );
};

export default NotificationEmail;
