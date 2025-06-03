import { cn } from "@rallly/ui";
import { Loader2Icon } from "lucide-react";

export const Spinner = (props: { className?: string }) => {
  return (
    <Loader2Icon
      className={cn(
        "inline-block h-5 animate-spin text-muted-foreground",
        props.className,
      )}
    />
  );
};
