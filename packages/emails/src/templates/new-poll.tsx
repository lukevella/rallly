import { defaultEmailContext, EmailContext } from "./_components/email-context";
import { EmailLayout } from "./_components/email-layout";
import { Button, Card, Link, Text } from "./_components/styled-components";

export interface NewPollEmailProps {
  title: string;
  name: string;
  adminLink: string;
  participantLink: string;
  ctx: EmailContext;
}

const ShareLink = ({
  title,
  participantLink,
  name,
  children,
}: React.PropsWithChildren<{
  name: string;
  title: string;
  participantLink: string;
}>) => {
  return (
    <Link
      href={`mailto:?subject=${encodeURIComponent(
        `Terminfindung für ${title}`,
      )}&body=${encodeURIComponent(
        `Hallo,\nIch versuche einen passenden Termin für ${title} zu finden.\nKannst du bitte den Link unten benutzen um deine bevorzugten Termine anzugeben:\n${participantLink}\nDankeschön.\n${name}`,
      )}`}
    >
      {children}
    </Link>
  );
};

export const NewPollEmail = ({
  title = "Untitled Poll",
  name = "John",
  adminLink = "https://rallly.co/admin/abcdefg123",
  participantLink = "https://rallly.co/invite/wxyz9876",
  ctx = defaultEmailContext,
}: NewPollEmailProps) => {
  const { baseUrl, domain } = ctx;
  return (
    <EmailLayout
      ctx={ctx}
      footNote={
        <>
          Du erhältst diese E-Mail, weil eine neue Umfrage unter Angabe dieser
          E-Mail-Adresse auf <Link href={baseUrl}>{domain}</Link> erstellt
          wurde. Falls dies nicht von dir veranlasst wurde, ignoriere bitte
          diese E-Mail.
        </>
      }
      recipientName={name}
      preview="Share your participant link to start collecting responses."
    >
      <Text>Deine Umfrage wurde erfolgreich angelegt!</Text>
      <Card>
        <Text>
          <strong>Titel:</strong> {title}
          <br />
          <strong>Einladungslink:</strong>{" "}
          <Link href={participantLink}>{participantLink}</Link>
        </Text>
        <Text>
          <ShareLink
            title={title}
            name={name}
            participantLink={participantLink}
          >
            Per E-Mail teilen
          </ShareLink>
        </Text>
      </Card>
      <Text>
        Um Teilnehmer*innen zu deiner Umfrage einzuladen, teile einfach den oben
        genannten <strong>Einladungslink</strong> mit ihnen. Sie können dann für
        ihre bevorzugten Termine und Zeiten abstimmen.
      </Text>
      <Text>
        Wenn du Änderungen an deiner Umfrage vornehmen möchtest oder die
        bisherigen Ergebnisse einsehen willst, klicke einfach auf den folgenden
        Button:
      </Text>
      <Text>
        <Button href={adminLink}>Manage Poll &rarr;</Button>
      </Text>
    </EmailLayout>
  );
};

export default NewPollEmail;
