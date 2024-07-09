import React, { useRef, useEffect } from "react";

interface VisibilityTriggerProps {
  onVisible: () => void;
}

const VisibilityTrigger: React.FC<VisibilityTriggerProps> = ({ onVisible }) => {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!triggerRef.current) return;

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

    observer.observe(triggerRef.current);

    return () => {
      if (triggerRef.current) {
        observer.unobserve(triggerRef.current);
      }
    };
  }, [onVisible]);

  return <div ref={triggerRef} />;
};

export default VisibilityTrigger;
