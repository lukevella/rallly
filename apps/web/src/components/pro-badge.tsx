import { Badge } from "@rallly/ui/badge";
import { Trans } from "next-i18next";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <Badge className={className}>
      <Trans i18nKey="planPro" />
    </Badge>
  );
};
