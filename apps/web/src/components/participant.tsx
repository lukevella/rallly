import { cn } from "@rallly/ui";
import React from "react";

export function Participant({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 items-center gap-x-2">{children}</div>;
}

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
      className={cn("truncate font-medium text-sm", {
        "hover:-translate-x-2 hover:cursor-pointer hover:overflow-visible hover:whitespace-nowrap hover:rounded-md hover:bg-white hover:p-2":
          isTruncated,
      })}
    >
      {children}
    </div>
  );
};
