import clsx from "clsx";

import SpinnerSvg from "@/components/icons/spinner.svg";

export const Spinner = (props: { className?: string }) => {
  return (
    <SpinnerSvg
      className={clsx("inline-block h-5 animate-spin", props.className)}
    />
  );
};
