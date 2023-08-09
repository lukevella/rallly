import { Badge } from "@rallly/ui/badge";

import { usePlan } from "@/contexts/plan";

export const ProBadge = ({ className }: { className?: string }) => {
  const isPaid = usePlan() === "paid";

  if (isPaid) {
    return null;
  }

  return <Badge className={className}>Pro</Badge>;
};
