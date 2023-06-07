import { cn } from "@rallly/ui";
import React from "react";

import { Container } from "@/components/container";
import { IconComponent } from "@/types";

export const TopBar = (
  props: React.PropsWithChildren<{
    title?: React.ReactNode;
    className?: string;
  }>,
) => {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 border-b bg-gray-50/75 py-3 backdrop-blur-md",
      )}
    >
      <Container className={cn(props.className)}>{props.children}</Container>
    </div>
  );
};

export const TopBarTitle = ({
  // icon: Icon,
  title,
}: {
  icon?: IconComponent;
  title: React.ReactNode;
}) => {
  return (
    <div className="flex h-9 min-w-0 items-center gap-2.5">
      {/* <Icon className="-ml-0.5 h-6 w-6 shrink-0" /> */}
      <div className="truncate font-medium">{title}</div>
    </div>
  );
};
