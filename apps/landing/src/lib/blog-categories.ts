import type { getTranslation } from "@/i18n/server";

type T = Awaited<ReturnType<typeof getTranslation>>["t"];

export function getCategoryLabels(t: T): Record<string, string> {
  return {
    Product: t("blogCategoryProduct", {
      ns: "blog",
      defaultValue: "Product",
    }),
    Guides: t("blogCategoryGuides", { ns: "blog", defaultValue: "Guides" }),
    Company: t("blogCategoryCompany", {
      ns: "blog",
      defaultValue: "Company",
    }),
    Security: t("blogCategorySecurity", {
      ns: "blog",
      defaultValue: "Security",
    }),
    "Self-hosting": t("blogCategorySelfHosting", {
      ns: "blog",
      defaultValue: "Self-hosting",
    }),
  };
}
