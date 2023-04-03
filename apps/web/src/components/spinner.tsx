import SpinnerSvg from "@rallly/icons/spinner.svg";
import clsx from "clsx";

export const Spinner = (props: { className?: string }) => {
  return (
    <SpinnerSvg
      className={clsx("inline-block h-5 animate-spin", props.className)}
    />
  );
};
