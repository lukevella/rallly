import { Badge } from "@rallly/ui/badge";

import { PLAN_NAMES } from "@/features/billing/constants";

export const ProBadge = ({ className }: { className?: string }) => {
  return (
    <Badge size="sm" variant="secondary" className={className}>
      {PLAN_NAMES.PRO}
    </Badge>
  );
};
