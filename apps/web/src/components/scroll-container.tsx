import { cn } from "@rallly/ui";
import { animate, motion, useDragControls } from "motion/react";
import * as React from "react";

const useIsOverflowing = <E extends Element | null>(
  ref: React.RefObject<E>,
) => {
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (ref.current) {
        const element = ref.current;
        const overflowX = element.scrollWidth > element.clientWidth;
        const overflowY = element.scrollHeight > element.clientHeight;

        setIsOverflowing(overflowX || overflowY);
      }
    };

    if (ref.current) {
      const resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(ref.current);
      if (ref.current.firstElementChild) {
        resizeObserver.observe(ref.current.firstElementChild);
      }

      const mutationObserver = new MutationObserver(checkOverflow);
      mutationObserver.observe(ref.current, { childList: true, subtree: true });

      checkOverflow();

      return () => {
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }
  }, [ref]);

  return isOverflowing;
};

export function ScrollContainer({
  className,
  children,
  onScroll,
  onOverflowChange,
  ref,
}: {
  ref: React.RefObject<HTMLDivElement | null>;
  className?: string;
  children: React.ReactNode;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  onOverflowChange?: (isOverflowing: boolean) => void;
}) {
  const controls = useDragControls();
  const [isDragging, setIsDragging] = React.useState(false);
  const animation = React.useRef<{ stop: () => void } | null>(null);
  const isOverflowing = useIsOverflowing(ref);

  React.useEffect(() => {
    if (onOverflowChange) {
      onOverflowChange(isOverflowing);
    }
  }, [isOverflowing, onOverflowChange]);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      onPointerDown={(e) => {
        if (e.defaultPrevented) return;
        const target = e.target as HTMLElement;
        if (
          target.closest(
            'button, a, input, textarea, select, [role="button"], [contenteditable]',
          )
        )
          return;
        controls.start(e);
      }}
      className={cn(
        "select-none scroll-auto",
        {
          "cursor-grab": isOverflowing && !isDragging,
          "cursor-grabbing": isOverflowing && isDragging,
        },
        className,
      )}
    >
      <motion.div
        drag="x"
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          animation.current?.stop();
          setIsDragging(true);
        }}
        onDrag={(_, info) => {
          if (ref.current) {
            ref.current.scrollLeft -= info.delta.x;
          }
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (!ref.current) return;
          const v = info.velocity.x;
          if (Math.abs(v) < 50) return;

          const el = ref.current;
          const from = el.scrollLeft;
          const maxScroll = el.scrollWidth - el.clientWidth;
          const to = Math.max(0, Math.min(from - v * 0.2, maxScroll));

          animation.current = animate(from, to, {
            type: "spring",
            bounce: 0,
            duration: 0.6,
            onUpdate: (latest) => {
              if (ref.current) ref.current.scrollLeft = latest;
            },
          });
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
