import { cn } from "@rallly/ui";
import { Avatar, AvatarFallback } from "@rallly/ui/avatar";
import React from "react";

export function Participant({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 items-center gap-x-2">{children}</div>;
}

const sizeToWidth = {
  xs: 20,
  sm: 24,
  md: 32,
  lg: 48,
};

export const ParticipantAvatar = ({
  size = "md",
  name,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  name: string;
}) => {
  return (
    <Avatar size={sizeToWidth[size]}>
      <AvatarFallback
        className={cn({
          "text-xs": size === "xs",
          "text-sm": size === "sm",
          "text-md": size === "md",
          "text-lg": size === "lg",
        })}
        seed={name}
      >
        {name[0]?.toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
};

export const ParticipantName = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = React.useState(false);
  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (ref.current) {
          setIsTruncated(ref.current.scrollWidth > ref.current.clientWidth);
        }
      }}
      onMouseLeave={() => {
        if (isTruncated) {
          setIsTruncated(false);
        }
      }}
      className={cn("truncate text-sm font-medium", {
        "hover:-translate-x-2 hover:cursor-pointer hover:overflow-visible hover:whitespace-nowrap hover:rounded-md hover:bg-white hover:p-2":
          isTruncated,
      })}
    >
      {children}
    </div>
  );
};
