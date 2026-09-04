import * as React from "react";
import DateFormatter from "@/components/blog/date-formatter";
import { LegalPageIndex } from "@/components/legal-page-index";

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textOf(node.props.children);
  }
  return "";
}

// Drops leading section numbers so anchors survive renumbering.
function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function indexHeadings(children: React.ReactNode) {
  const items: { id: string; title: string }[] = [];
  const content = React.Children.map(children, (child) => {
    if (
      !React.isValidElement<{ id?: string; children?: React.ReactNode }>(
        child,
      ) ||
      child.type !== "h2"
    ) {
      return child;
    }
    const title = textOf(child.props.children);
    const id = child.props.id ?? slugify(title);
    items.push({ id, title });
    return React.cloneElement(child, { id });
  });
  return { items, content };
}

export function LegalPageLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  const { items, content } = indexHeadings(children);
  return (
    <>
      <h1 className="max-w-2xl text-balance font-medium text-3xl text-gray-800 tracking-tight sm:text-4xl">
        {title}
      </h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:order-2 lg:w-56 lg:shrink-0">
          {items.length > 0 ? (
            <div className="hidden lg:block">
              <LegalPageIndex items={items} />
            </div>
          ) : null}
          <dl className="flex flex-wrap gap-x-12 gap-y-6 lg:flex-col">
            <div>
              <dt className="text-gray-500 text-sm">Last updated</dt>
              <dd className="mt-1 text-gray-800">
                <DateFormatter dateString={lastUpdated} />
              </dd>
            </div>
          </dl>
        </aside>
        <div className="longform min-w-0 max-w-2xl lg:order-1">{content}</div>
      </div>
    </>
  );
}
