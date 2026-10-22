/**
 * Overview's thread with cards beside it. The page scrolls as one; on large
 * screens the cards stick below the poll header (3.5rem) while the thread
 * scrolls past. Below that the cards stack under the thread.
 */
export function OverviewLayout({
  thread,
  cards,
}: {
  thread: React.ReactNode;
  cards: React.ReactNode;
}) {
  return (
    <div className="px-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <div className="py-4">
        <div className="mx-auto w-full max-w-[680px]">{thread}</div>
      </div>
      <aside className="space-y-3 py-4 lg:sticky lg:top-14 lg:self-start">
        {cards}
      </aside>
    </div>
  );
}
