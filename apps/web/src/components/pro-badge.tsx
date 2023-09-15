import { Badge } from "@rallly/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { useRouter } from "next/router";
import { Trans } from "next-i18next";

import { usePlan } from "@/contexts/plan";

export const ProBadge = ({ className }: { className?: string }) => {
  const isPaid = usePlan() === "paid";
  const router = useRouter();
  if (isPaid) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex"
        type="button"
        onClick={() => {
          router.push("/settings/billing");
        }}
      >
        <Badge className={className}>
          <Trans i18nKey="planPro" />
        </Badge>
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
