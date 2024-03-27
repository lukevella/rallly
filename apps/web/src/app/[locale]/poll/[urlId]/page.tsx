import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import Link from "next/link";
import { Trans } from "react-i18next/TransWithoutContext";

import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { InviteDialog } from "@/components/invite-dialog";
import { Poll } from "@/components/poll";

import { GuestPollAlert } from "./guest-poll-alert";

interface PollPageParams extends Params {
  urlId: string;
}

export default async function Page({ params }: { params: PollPageParams }) {
  const { t } = await getTranslation(params.locale);
  return (
    <div className={cn("space-y-4")}>
      <div className="-mx-1 space-y-3 sm:space-y-6">
        <GuestPollAlert />
        <div className="grid grid-cols-3 gap-4">
          <Button>Edit</Button>
          <InviteDialog />
          <Button asChild>
            <Link href={`/poll/${params.urlId}/finalize`}>
              <Trans t={t} i18nKey="finalize" defaults="Finalize" />
            </Link>
          </Button>
        </div>
        <Poll />
      </div>
    </div>
  );
}
