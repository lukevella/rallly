"use client";

import { defaultLocale } from "@rallly/languages";
import Link from "next/link";
import { useTranslation } from "@/i18n/client/use-translation";

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
  const { i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === defaultLocale ? "" : `/${i18n.resolvedLanguage}`;
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
