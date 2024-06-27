import { notFound } from "next/navigation";
import { z } from "zod";

import { getTranslation } from "@/app/i18n";

import { LoginPage } from "./login-page";

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  magicLink: z.string().url(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

const magicLinkParams = z.object({
  email: z.string().email(),
  token: z.string(),
});

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  const parse = searchParamsSchema.safeParse(searchParams);

  if (!parse.success) {
    return notFound();
  }

  const { magicLink } = parse.data;

  const url = new URL(magicLink);

  const parseMagicLink = magicLinkParams.safeParse(
    Object.fromEntries(url.searchParams),
  );

  if (!parseMagicLink.success) {
    return notFound();
  }

  const { email } = parseMagicLink.data;

  return <LoginPage magicLink={magicLink} email={email} />;
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
