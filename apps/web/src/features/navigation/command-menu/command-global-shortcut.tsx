import React from "react";

function cmdKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    return e.key;
  }
  return false;
}

export function CommandGlobalShortcut({ trigger }: { trigger: () => void }) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (cmdKey(e)) {
        case "k":
          e.preventDefault();
          trigger();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [trigger]);

  // This component doesn't render anything
  return null;
}
