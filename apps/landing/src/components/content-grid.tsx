import { cn } from "@rallly/ui";
import { ArrowRightIcon } from "lucide-react";
import type * as React from "react";

export function ContentGrid({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    />
  );
}

export function ContentGridItem({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={className} {...props} />;
}

export function ContentGridTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "flex items-center gap-x-2.5 font-medium text-base text-gray-800 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-gray-500",
        className,
      )}
      {...props}
    />
  );
}

export function ContentGridDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mt-2 text-pretty text-gray-500 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

export function ContentGridLink({
  className,
  children,
  ...props
}: React.ComponentProps<"a">) {
  return (
    <a
      className={cn(
        "group mt-2 inline-flex items-center gap-x-1 font-medium text-primary text-sm hover:underline",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRightIcon
        className="size-3 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </a>
  );
}
