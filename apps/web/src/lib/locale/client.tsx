"use client";
import { toast } from "@rallly/ui/sonner";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useTranslation } from "react-i18next";
import { LOCALE_COOKIE_NAME } from "@/lib/locale/constants";

export function LocaleSync({ userLocale }: { userLocale: string }) {
  const { locale } = useParams();
  const router = useRouter();
  const { t } = useTranslation();

  React.useEffect(() => {
    // update the cookie with the user locale if it's different from the current locale
    if (locale !== userLocale) {
      setLocaleCookie(userLocale);
      toast.info(
        t("localeSyncToast", {
          defaultValue: "Your language preferences changed",
        }),
        {
          action: {
            label: "Refresh",
            onClick: () => {
              router.refresh();
            },
          },
        },
      );
    }
  }, [locale, userLocale, router.refresh, t]);

  return null;
}

export function setLocaleCookie(locale: string) {
  Cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/" });
}
