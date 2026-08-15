import { cn } from "@rallly/ui";
import { CheckIcon, XIcon } from "lucide-react";
import type { DemoVote } from "./demo-data";

export const IfNeedBeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3.5}
    strokeLinecap="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M4 13.5c2.5-5 5-5 7-1s4.5 4 7-1" />
  </svg>
);

export const VoteIcon = ({
  vote,
  className,
}: {
  vote: DemoVote;
  className?: string;
}) => {
  if (vote === "yes") {
    return (
      <CheckIcon
        strokeWidth={3.5}
        className={cn("text-green-500", className)}
      />
    );
  }
  if (vote === "ifNeedBe") {
    return <IfNeedBeIcon className={cn("text-amber-400", className)} />;
  }
  return <XIcon strokeWidth={3.5} className={cn("text-gray-400", className)} />;
};
