import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { getTranslation } from "@/i18n/server";

import { LoginPage } from "./components/login-page";

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  email: z.email(),
  code: z.string(),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export default async function Page(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const parse = searchParamsSchema.safeParse(searchParams);

  if (!parse.success) {
    return notFound();
  }

  const { email, code } = parse.data;

  return <LoginPage email={email} code={code} />;
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
