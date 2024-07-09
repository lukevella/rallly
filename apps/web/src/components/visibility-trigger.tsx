import React, { useRef, useEffect } from "react";

interface VisibilityTriggerProps {
  onVisible: () => void;
}

  useEffect(() => {
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
};

export default VisibilityTrigger;
