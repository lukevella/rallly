import { UserIcon } from "lucide-react";

export function YouAvatar() {
  return (
    <div className="inline-flex size-5 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground text-xs">
      <UserIcon className="size-3" />
    </div>
  );
}
