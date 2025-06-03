import { cn } from "@rallly/ui";

export function DescriptionList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dl">) {
  return (
    <dl
      {...props}
      className={cn(
        className,
        "grid grid-cols-1 text-sm/6 sm:grid-cols-[min(50%,320px)_auto]",
      )}
    />
  );
}

export function DescriptionTerm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dt">) {
  return (
    <dt
      {...props}
      className={cn(
        className,
        "col-start-1 border-gray-800/5 border-t pt-3 text-gray-500 first:border-none sm:border-gray-800/5 sm:border-t sm:py-3 dark:border-white/5 dark:text-gray-400 sm:dark:border-white/5",
      )}
    />
  );
}

export function DescriptionDetails({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"dd">) {
  return (
    <dd
      {...props}
      className={cn(
        className,
        "pt-1 pb-3 text-gray-800 sm:border-gray-800/5 sm:border-t sm:py-3 dark:text-white dark:sm:border-white/5 sm:[&:nth-child(2)]:border-none",
      )}
    />
  );
}
