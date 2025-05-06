import type { VoteType } from "@rallly/database";

import { IfNeedBeIcon } from "@/components/vote-icon/if-need-be-icon";
import { NoIcon } from "@/components/vote-icon/no-icon";
import { PendingIcon } from "@/components/vote-icon/pending-icon";
import { YesIcon } from "@/components/vote-icon/yes-icon";
import { cn } from "@rallly/ui";
import { type VariantProps, cva } from "class-variance-authority";

const iconVariants = cva("", {
  variants: {
    size: {
      sm: "size-4",
      md: "size-5",
    },
  },
});

type IconVariantProps = VariantProps<typeof iconVariants>;

const VoteIcon = ({
  type,
  size = "md",
  className,
}: {
  type?: VoteType;
  className?: string;
} & IconVariantProps) => {
  const iconClassName = iconVariants({ size });
  switch (type) {
    case "yes":
      return <YesIcon className={cn(iconClassName, className)} />;
    case "ifNeedBe":
      return <IfNeedBeIcon className={cn(iconClassName, className)} />;
    case "no":
      return <NoIcon className={cn(iconClassName, className)} />;

    default:
      return <PendingIcon className={cn(iconClassName, className)} />;
  }
};

export default VoteIcon;
