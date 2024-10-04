import { cn } from "@rallly/ui";
import { BarChart2Icon } from "lucide-react";

export function GroupPollIcon({
  size = "md",
}: {
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return (
    <div
      role="img"
      aria-label="Group Poll Icon"
      className={cn(
        "inline-flex items-center justify-center bg-purple-600 text-purple-50",
        {
          "size-6 rounded": size === "xs",
          "size-8 rounded-md": size === "sm",
          "size-9 rounded-md": size === "md",
          "size-10 rounded-lg": size === "lg",
        },
      )}
    >
      <BarChart2Icon
        className={cn({
          "size-4": size === "sm" || size === "xs",
          "size-5": size === "md",
          "size-6": size === "lg",
        })}
      />
    </div>
  );
}
