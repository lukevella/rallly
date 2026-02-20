import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Resource } from "i18next";
import { defaultNS, fallbackLng } from "../settings";

export async function getResources(locale: string): Promise<Resource> {
  const resources: Resource = {};

  const localesToLoad =
    locale === fallbackLng ? [locale] : [locale, fallbackLng];

  for (const lng of localesToLoad) {
    const filePath = resolve(
      process.cwd(),
      `public/locales/${lng}/${defaultNS}.json`,
    );
    const content = await readFile(filePath, "utf-8");
    resources[lng] = {
      [defaultNS]: JSON.parse(content),
    };
  }

  return resources;
}
