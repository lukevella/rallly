import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import * as React from "react";

export interface TooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
  className?: string;
}

const LegacyTooltip: React.FunctionComponent<TooltipProps> = ({
  className,
  children,
  content,
}) => {
  return (
    <Tooltip>
      <TooltipTrigger className={className}>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
};

export default React.memo(LegacyTooltip);
