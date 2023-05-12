import clsx from "clsx";

export const Card = (
  props: React.PropsWithChildren<{
    className?: string;
    fullWidthOnMobile?: boolean;
  }>,
) => {
  return (
    <div
      className={clsx(
        "max-w-full overflow-hidden bg-white shadow-sm",
        props.fullWidthOnMobile
          ? "border-y sm:rounded-md sm:border-x"
          : "rounded-md border shadow-sm",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
};
