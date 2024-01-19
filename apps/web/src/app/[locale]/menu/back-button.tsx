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
      <XIcon className="text-muted-foreground h-4 w-4" />
    </Button>
  );
}
