"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

function cmdKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    return e.key;
  }
  return false;
}

export function CommandGlobalShortcut({ trigger }: { trigger: () => void }) {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (cmdKey(e)) {
        case "k":
          e.preventDefault();
          trigger();
          break;
        case "g":
          e.preventDefault();
          router.push("/polls");
          break;
        case "e":
          e.preventDefault();
          router.push("/events");
          break;
        case "b":
          e.preventDefault();
          router.push("/settings/billing");
          break;
        case "u":
          e.preventDefault();
          router.push("/settings/profile");
          break;
        case "p":
          e.preventDefault();
          router.push("/settings/preferences");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [router, trigger]);

  // This component doesn't render anything
  return null;
}
