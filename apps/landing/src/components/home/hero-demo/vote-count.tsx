import { cn } from "@rallly/ui";
import { UsersIcon } from "lucide-react";

// Shared by the desktop and mobile demos: options with the highest count
// render more prominently, like the score summary in the app.
export const VoteCount = ({
  count,
  highlight,
  className,
}: {
  count: number;
  highlight?: boolean;
  className?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-center gap-1 text-xs",
      highlight ? "font-medium text-gray-700" : "text-gray-400",
      className,
    )}
  >
    <UsersIcon className="size-3.5" />
    {count}
  </div>
);
