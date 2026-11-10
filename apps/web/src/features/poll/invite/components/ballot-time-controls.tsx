import { cn } from "@rallly/ui";

/**
 * The header of the options, edge to edge across their panel, with the same
 * translucent background as the footer so the options show through it.
 */
export function BallotTimeControls({
  timeZone,
  timeFormat,
  belowResponseBar,
}: {
  timeZone: React.ReactNode;
  timeFormat: React.ReactNode;
  /** The bar a phone keeps at the top once there is a response. */
  belowResponseBar: boolean;
}) {
  return (
    <>
      {/* The gap above, separate so it can go when this starts the section. */}
      <div aria-hidden="true" className="mt-3" />
      <div
        className={cn(
          // From lg it starts at the top of the panel with even padding, and the
          // negative bottom margin keeps the content below where it was. The
          // panel's own top padding counts toward a sticky offset; -top cancels it.
          "sticky z-10 -my-2 flex items-center justify-between gap-x-4 bg-card/70 py-2 backdrop-blur-md max-lg:-mx-4 max-lg:px-4 lg:-top-6.25 lg:-mx-8 lg:-mt-6.25 lg:-mb-4 lg:px-8 lg:pt-4 lg:pb-4",
          belowResponseBar ? "max-lg:top-13" : "max-lg:top-0",
        )}
      >
        {timeZone ? <div className="min-w-0">{timeZone}</div> : null}
        <div className="ml-auto shrink-0">{timeFormat}</div>
      </div>
    </>
  );
}
