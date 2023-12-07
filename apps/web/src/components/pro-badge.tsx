import { Badge } from "@rallly/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { Trans } from "next-i18next";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild className="inline-flex" type="button">
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
