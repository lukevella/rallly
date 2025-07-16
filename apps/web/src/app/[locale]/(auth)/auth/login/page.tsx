import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getTranslation } from "@/i18n/server";

import { LoginPage } from "./components/login-page";

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  magicLink: z.string().url(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

const magicLinkParams = z.object({
  email: z.string().email(),
  token: z.string(),
});

export default async function Page(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
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

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { t } = await getTranslation(params.locale);
  return {
    title: t("login"),
  };
}
