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
  const [isPointerDown, setIsPointerDown] = React.useState(false);
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
        setIsPointerDown(true);
      }}
      onPointerUp={() => {
        setIsPointerDown(false);
      }}
      className={cn(
        "scroll-auto",
        {
          "cursor-grab": isOverflowing && !isPointerDown,
          "cursor-grabbing": isOverflowing && isPointerDown,
          "select-none": isOverflowing && isDragging,
        },
        className,
      )}
    >
      <motion.div
        drag
        dragControls={controls}
        dragListener={false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          animation.current?.stop();
          setIsDragging(true);
        }}
        onDrag={(_, info) => {
          if (ref.current) {
            ref.current.scrollLeft -= info.delta.x;
            ref.current.scrollTop -= info.delta.y;
          }
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (!ref.current) return;

          const el = ref.current;
          const vx = info.velocity.x;
          const vy = info.velocity.y;

          if (Math.abs(vx) < 50 && Math.abs(vy) < 50) return;

          const fromX = el.scrollLeft;
          const fromY = el.scrollTop;
          const maxScrollX = el.scrollWidth - el.clientWidth;
          const maxScrollY = el.scrollHeight - el.clientHeight;
          const toX = Math.max(0, Math.min(fromX - vx * 0.2, maxScrollX));
          const toY = Math.max(0, Math.min(fromY - vy * 0.2, maxScrollY));

          animation.current = animate(0, 1, {
            type: "spring",
            bounce: 0,
            duration: 0.6,
            onUpdate: (p) => {
              if (ref.current) {
                ref.current.scrollLeft = fromX + (toX - fromX) * p;
                ref.current.scrollTop = fromY + (toY - fromY) * p;
              }
            },
          });
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
