import { Badge } from "@rallly/ui/badge";

import { Trans } from "@/components/trans";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <Badge variant="secondary" className={className}>
      <Trans i18nKey="planPro" />
    </Badge>
  );
};
