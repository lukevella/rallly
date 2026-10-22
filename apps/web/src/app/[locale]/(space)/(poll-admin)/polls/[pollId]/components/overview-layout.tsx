/**
 * Overview's thread with cards beside it. On large screens each column
 * scrolls on its own; below that the cards stack under the thread and the
 * page scrolls as one.
 */
export function OverviewLayout({
  thread,
  cards,
}: {
  thread: React.ReactNode;
  cards: React.ReactNode;
}) {
  return (
    <div className="px-4 lg:grid lg:h-full lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <div className="min-h-0 py-4 lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-[680px]">{thread}</div>
      </div>
      <aside className="min-h-0 space-y-3 py-4 lg:overflow-y-auto">
        {cards}
      </aside>
    </div>
  );
}
