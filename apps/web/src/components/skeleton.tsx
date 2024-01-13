import { cn } from "@rallly/ui";
import React from "react";

export const Skeleton = (props: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", props.className)}
    >
      {props.children}
    </div>
  );
};

export function SkeletonCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}
