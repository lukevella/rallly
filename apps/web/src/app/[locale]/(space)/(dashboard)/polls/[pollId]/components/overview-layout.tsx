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
    <div className="px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
      <div className="py-6">
        <div className="mx-auto w-full max-w-[680px]">{thread}</div>
      </div>
      <aside className="space-y-4 pb-6 lg:sticky lg:top-14 lg:self-start lg:py-6">
        {cards}
      </aside>
    </div>
  );
}
