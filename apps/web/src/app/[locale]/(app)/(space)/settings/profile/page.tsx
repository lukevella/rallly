import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";

import type { Params } from "@/app/[locale]/types";
import { getTranslation } from "@/i18n/server";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { ProfilePage } from "./profile-page";

export default async function Page() {
  const helpers = await createPrivateSSRHelper();
  await helpers.user.getAuthed.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <ProfilePage />
    </HydrationBoundary>
  );
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("profile"),
  };
}
