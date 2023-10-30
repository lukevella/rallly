import { Badge } from "@rallly/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import Link from "next/link";
import { Trans } from "next-i18next";

import { usePlan } from "@/contexts/plan";

export const ProBadge = ({ className }: { className?: string }) => {
  const isPaid = usePlan() === "paid";
  if (isPaid) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild className="inline-flex" type="button">
        <Link href="/settings/billing">
          <Badge className={className}>
            <Trans i18nKey="planPro" />
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <Trans
          i18nKey="pleaseUpgrade"
          defaults="Please upgrade to Pro to use this feature"
        />
      </TooltipContent>
    </Tooltip>
  );
};
