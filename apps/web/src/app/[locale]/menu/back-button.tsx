"use client";

import { Button } from "@rallly/ui/button";
import { XIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      onClick={() => {
        router.back();
      }}
    >
      <XIcon className="text-muted-foreground size-4" />
    </Button>
  );
}
