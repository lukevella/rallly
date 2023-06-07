import { cn } from "@rallly/ui";

export const Card = (
  props: React.PropsWithChildren<{
    className?: string;
    fullWidthOnMobile?: boolean;
  }>,
) => {
  return (
    <div
      className={cn(
        "max-w-full overflow-hidden bg-white shadow-sm",
        props.fullWidthOnMobile
          ? "sm:rounded-md sm:border-y sm:border-x"
          : "rounded-md border shadow-sm",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
