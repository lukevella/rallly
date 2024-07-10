import React from "react";

export function useVisibilityTrigger<T extends Element>(onVisible: () => void) {
  const triggerRef = React.useRef<T | null>(null);

  React.useEffect(() => {
    const currentTriggerRef = triggerRef.current;
    if (!currentTriggerRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVisible();
        }
      },
      {
        root: null, // Use the viewport as the root
        rootMargin: "0px",
        threshold: 1.0, // Trigger when 100% of the element is visible
      },
    );

    observer.observe(currentTriggerRef);

    return () => {
      if (currentTriggerRef) {
        observer.unobserve(currentTriggerRef);
      }
    };
  }, [onVisible]);

  return triggerRef;
}

export function VisibilityTrigger({
  children,
  onVisible,
  className,
}: {
  children: React.ReactNode;
  onVisible: () => void;
  className?: string;
}) {
  const triggerRef = useVisibilityTrigger<HTMLDivElement>(onVisible);

  return (
    <div className={className} ref={triggerRef}>
      {children}
    </div>
  );
}
