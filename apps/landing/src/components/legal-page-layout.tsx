import DateFormatter from "@/components/blog/date-formatter";

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="max-w-2xl text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <aside className="lg:sticky lg:top-24 lg:order-2 lg:w-56 lg:shrink-0">
          <dl className="flex flex-wrap gap-x-12 gap-y-6 lg:flex-col">
            <div>
              <dt className="text-gray-500 text-sm">Last updated</dt>
              <dd className="mt-1 text-gray-800">
                <DateFormatter dateString={lastUpdated} />
              </dd>
            </div>
          </dl>
        </aside>
        <div className="longform min-w-0 max-w-2xl lg:order-1">{children}</div>
      </div>
    </>
  );
}
