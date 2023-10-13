import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export const useLocale = () => {
  const { locale, reload } = useRouter();
  const session = useSession();

  return {
    locale: locale ?? "en",
    updateLocale: (locale: string) => {
      session.update({ locale });

      reload();
    },
  };
};
