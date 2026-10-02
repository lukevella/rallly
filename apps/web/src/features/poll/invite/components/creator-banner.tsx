"use client";
import { buttonVariants } from "@rallly/ui";
import { Alert, AlertAction, AlertDescription } from "@rallly/ui/alert";
import { ArrowUpRightIcon, CrownIcon } from "lucide-react";
import { Link } from "@/components/link";
import { usePoll } from "@/features/poll/client";
import { useUser } from "@/features/user/client";
import { Trans } from "@/i18n/client";

/** Points the poll's creator from the participant view to the admin page. */
export function CreatorBanner() {
  const poll = usePoll();
  const { user } = useUser();

  if (!user || user.id !== poll.userId) {
    return null;
  }

  return (
    <Alert variant="primary">
      <CrownIcon />
      <AlertDescription>
        <p>
          <Trans
            i18nKey="eventHostDescription"
            defaults="You are the creator of this poll"
          />
        </p>
      </AlertDescription>
      <AlertAction>
        <Link
          className={buttonVariants({ variant: "primary", size: "sm" })}
          href={`/poll/${poll.id}`}
          prefetch={false}
        >
          <Trans i18nKey="manage" defaults="Manage" />
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </AlertAction>
    </Alert>
  );
}
