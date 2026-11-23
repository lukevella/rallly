import { SpaceIcon } from "@/features/space/components/space-icon";

/**
 * The brand (a space, or the instance under white label) and the event
 * stacked as one block, heading the sidebar. The icon stays 48px, the least
 * most logos need to read.
 */
export function EventLockup({
  name,
  image,
  title,
}: {
  name: string;
  image: string | null;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-2">
      {/* The name is right below it, so the icon would only say it twice. */}
      <span aria-hidden="true" className="flex shrink-0">
        <SpaceIcon
          name={name}
          src={image ?? undefined}
          size="lg"
          className="size-12"
        />
      </span>
      <p className="max-w-full truncate text-muted-foreground text-sm">
        {name}
      </p>
      <h1 className="text-balance font-semibold text-xl tracking-tight">
        {title}
      </h1>
    </div>
  );
}
