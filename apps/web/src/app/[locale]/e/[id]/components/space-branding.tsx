import { cn } from "@rallly/ui";
import { SpaceIcon } from "@/features/space/components/space-icon";

export function SpaceBranding({
  name,
  image,
  className,
}: {
  name: string;
  image?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <SpaceIcon name={name} src={image} size="lg" />
      <p className="font-medium text-muted-foreground text-sm">{name}</p>
    </div>
  );
}
