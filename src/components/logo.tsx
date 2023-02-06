import clsx from "clsx";

export const Logo = (props: { className?: string; color?: boolean }) => {
  const { color = true } = props;
  return (
    <span
      className={clsx(
        "font-semibold uppercase tracking-widest",
        {
          "text-primary-500": color,
        },
        props.className,
      )}
    >
      Rallly
    </span>
  );
};
