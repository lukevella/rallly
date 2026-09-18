import { buttonVariants } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import { Trans } from "react-i18next/TransWithoutContext";
import { Link } from "@/components/link";
import { getTranslation } from "@/i18n/server";

/** Points the poll's creator from the participant view to the admin page. */
export async function CreatorBanner({ pollId }: { pollId: string }) {
  const { t, i18n } = await getTranslation();

  return (
    <Alert variant="primary">
      <CrownIcon />
      <AlertDescription>
        <p>
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="eventHostDescription"
            defaults="You are the creator of this poll"
          />
        </p>
      </AlertDescription>
      <AlertAction>
        <Link
          className={buttonVariants({ variant: "primary", size: "sm" })}
          href={`/poll/${pollId}`}
          prefetch={false}
        >
          <Trans
            t={t}
            i18n={i18n}
            ns="app"
            i18nKey="manage"
            defaults="Manage"
          />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </AlertAction>
    </Alert>
  );
}
