import { UserIcon } from "lucide-react";

export function YouAvatar() {
  return (
    <div className="inline-flex size-6 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
      <UserIcon className="size-4" />
    </div>
  );
}
