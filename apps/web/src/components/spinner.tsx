import clsx from "clsx";
import { Loader2Icon } from "lucide-react";

export const Spinner = (props: { className?: string }) => {
  return (
    <Loader2Icon
      className={clsx(
        "text-muted-foreground inline-block h-5 animate-spin",
        props.className,
      )}
    />
  );
};
