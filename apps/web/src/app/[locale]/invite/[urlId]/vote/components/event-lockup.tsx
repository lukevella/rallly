import { SpaceIcon } from "@/features/space/components/space-icon";

/**
 * The space and the event stacked as one block, heading the sidebar. The icon
 * stays 48px, the least most logos need to read.
 */
export function EventLockup({
  spaceName,
  spaceImage,
  title,
}: {
  spaceName: string;
  spaceImage: string | null;
  title: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      {/* The name is right below it, so the icon would only say it twice. */}
      <span aria-hidden="true" className="flex shrink-0">
        <SpaceIcon
          name={spaceName}
          src={spaceImage ?? undefined}
          size="lg"
          className="size-12"
        />
      </span>
      <p className="max-w-full truncate text-muted-foreground text-sm">
        {spaceName}
      </p>
      <h1 className="mt-1 text-balance font-semibold text-xl tracking-tight">
        {title}
      </h1>
    </div>
  );
}
