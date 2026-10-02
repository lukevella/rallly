import { buttonVariants } from "@rallly/ui";
import { SettingsIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Link } from "@/components/link";
import { getTranslation } from "@/i18n/server";

/**
 * Takes the host from the participant view through to the admin page.
 * Shown only to someone who can actually manage the poll, so it never
 * leads to a redirect back here.
 */
export async function ManagePollButton({ pollId }: { pollId: string }) {
  const { t, i18n } = await getTranslation();

  return (
    <Link
      className={buttonVariants()}
      href={`/poll/${pollId}`}
      prefetch={false}
    >
      <SettingsIcon data-icon="inline-start" />
      <Trans t={t} i18n={i18n} ns="app" i18nKey="manage" defaults="Manage" />
    </Link>
  );
}
