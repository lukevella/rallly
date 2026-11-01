"use client";

import { defaultLocale } from "@rallly/languages";
import Link from "next/link";
import { useParams } from "next/navigation";

export const LinkBase = ({
  href,
  children,
  className,
  prefetch,
  "aria-current": ariaCurrent,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
  prefetch?: boolean;
  "aria-current"?: React.AriaAttributes["aria-current"];
}) => {
  // The route segment, not i18next's resolved language: a locale without its
  // own resources (en-GB) resolves to en, which would point every link at
  // another locale's pages.
  const params = useParams<{ locale?: string }>();
  const locale =
    !params.locale || params.locale === defaultLocale
      ? ""
      : `/${params.locale}`;
  const newHref = href.startsWith("/") ? `${locale}${href}` : href;

  return (
    <Link
      className={className}
      href={newHref}
      prefetch={prefetch}
      aria-current={ariaCurrent}
    >
      {children}
    </Link>
  );
};
