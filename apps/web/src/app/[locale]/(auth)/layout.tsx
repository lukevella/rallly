import { redirect, RedirectType } from "next/navigation";

import { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/app/i18n";
import { getServerSession } from "@/utils/auth";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const session = await getServerSession();

  if (session?.user.email) {
    return redirect("/", RedirectType.replace);
  }

  return (
    <div className="relative flex h-screen flex-col items-center gap-4 p-4">
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        {children}
      </div>
      <div className="text-muted-foreground flex w-full justify-between px-4 text-sm">
        <div>© 2024 Rallly</div>
        <div>
          <a href="https://support.rallly.co">Support</a>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login", {
      ns: "app",
    }),
  };
}
