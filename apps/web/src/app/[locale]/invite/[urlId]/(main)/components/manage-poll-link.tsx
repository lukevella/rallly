"use client";

import { buttonVariants, cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { ArrowUpRightIcon } from "lucide-react";
import { Link } from "@/components/link";
import { Trans } from "@/i18n/client";

/** A way through to the admin page for someone who can manage the poll. */
export function ManagePollLink({ pollId }: { pollId: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Link
            href={`/poll/${pollId}`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground hover:text-foreground",
            )}
          />
        }
      >
        <Trans i18nKey="inviteNavManage" defaults="Manage" />
        <ArrowUpRightIcon data-icon="inline-end" />
      </TooltipTrigger>
      <TooltipContent>
        <Trans i18nKey="inviteNavManageHint" defaults="Only you can see this" />
      </TooltipContent>
    </Tooltip>
  );
}
