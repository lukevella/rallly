import { dehydrate, Hydrate } from "@tanstack/react-query";

import { createSSRHelper } from "@/trpc/server/create-ssr-helper";

import Providers from "./providers";

export default async function Layout({
  children,
  params,
}: {
  params: { urlId: string };
  children: React.ReactNode;
}) {
  const trpc = await createSSRHelper();

  await Promise.all([
    trpc.polls.get.prefetch({ urlId: params.urlId }),
    trpc.polls.participants.list.prefetch({ pollId: params.urlId }),
    trpc.polls.comments.list.prefetch({ pollId: params.urlId }),
  ]);
  return (
    <Hydrate state={dehydrate(trpc.queryClient)}>
      <Providers>{children}</Providers>
    </Hydrate>
  );
}
