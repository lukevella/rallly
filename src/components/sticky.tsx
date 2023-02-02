import clsx from "clsx";
import React from "react";

export const useDetectSticky = <E extends HTMLElement>(
  top: number,
): [React.RefObject<E>, boolean] => {
  const [pinned, setPinned] = React.useState(false);
  const ref = React.useRef<E>(null);

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([e]) => setPinned(e.intersectionRatio < 1),
      { rootMargin: `-${top + 1}px 0px 0px 0px`, threshold: [1] },
    );

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [top]);

  return [ref, pinned];
};

export const Sticky: React.VoidFunctionComponent<{
  children?: React.ReactNode | React.FunctionComponent<{ isPinned: boolean }>;
  className?: string | ((isPinned: boolean) => string);
  top: number;
}> = ({ className, children, top, ...rest }) => {
  const [ref, isPinned] = useDetectSticky<HTMLDivElement>(top);

  return (
    <div
      ref={ref}
      className={clsx(
        "sticky",
        typeof className === "function" ? className(isPinned) : className,
      )}
      style={{ top }}
      {...rest}
    >
      {typeof children === "function" ? children({ isPinned }) : children}
    </div>
  );
};
