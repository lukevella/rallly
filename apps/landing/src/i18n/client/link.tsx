"use client";

import { defaultLocale } from "@rallly/languages";
import Link from "next/link";
import { useTranslation } from "react-i18next";

export const LinkBase = ({
  href,
  children,
  className,
}: {
  href: string;
  children?: React.ReactNode;
  className?: string;
}) => {
  const { i18n } = useTranslation();
  const locale =
    i18n.resolvedLanguage === defaultLocale ? "" : `/${i18n.resolvedLanguage}`;
  const newHref = href.startsWith("/") ? `${locale}${href}` : href;

  return (
    <Link className={className} href={newHref}>
      {children}
    </Link>
  );
};
