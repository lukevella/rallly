import clsx from "clsx";

export const Logo = (props: { className?: string; color?: boolean }) => {
  const { color = true } = props;
  return (
    <span className="inline-flex select-none items-center">
      <span
        className={clsx(
          "font-semibold uppercase tracking-widest",
          {
            "text-primary-600": color,
          },
          props.className,
        )}
      >
        Rallly
      </span>
      {process.env.NEXT_PUBLIC_BETA === "1" ? (
        <span className="ml-2 inline-block rounded bg-rose-500 px-1 text-xs lowercase tracking-tight text-slate-50">
          beta
        </span>
      ) : null}
    </span>
  );
};
