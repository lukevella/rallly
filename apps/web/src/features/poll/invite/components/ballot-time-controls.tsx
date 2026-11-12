/** The header of the options: the time zone on one side, the time format on the other. */
export function BallotTimeControls({
  timeZone,
  timeFormat,
}: {
  timeZone: React.ReactNode;
  timeFormat: React.ReactNode;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-x-4">
      {timeZone ? <div className="min-w-0">{timeZone}</div> : null}
      <div className="ml-auto shrink-0">{timeFormat}</div>
    </div>
  );
}
