import type { RenderOptions, RenderResult } from "@testing-library/react";
import { render as rtlRender } from "@testing-library/react";
import { createInstance } from "i18next";
import ICU from "i18next-icu";
import resourcesToBackend from "i18next-resources-to-backend";
import type { ReactElement } from "react";
import { I18nextProvider, initReactI18next } from "react-i18next";

import { defaultNS, getOptions } from "@/i18n/settings";

interface TestWrapperProps {
  children: React.ReactNode;
  locale?: string;
}

function TestWrapper({ children, locale = "en" }: TestWrapperProps) {
  // Create a synchronous i18n instance for tests
  const i18n = createInstance()
    .use(initReactI18next)
    .use(ICU)
    .use(
      resourcesToBackend((language: string, namespace: string) => {
        return import(`../../public/locales/${language}/${namespace}.json`);
      }),
    );

  // Initialize synchronously for tests
  i18n.init({
    ...getOptions(locale),
    react: {
      useSuspense: false, // Important for tests
    },
  });

  return (
    <I18nextProvider i18n={i18n} defaultNS={defaultNS}>
      {children}
    </I18nextProvider>
  );
}

interface CustomRenderOptions extends RenderOptions {
  locale?: string;
}

function render(
  ui: ReactElement,
  options: CustomRenderOptions = {},
): RenderResult {
  const { locale, ...renderOptions } = options;

  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <TestWrapper locale={locale}>{children}</TestWrapper>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";

// Override render export
export { render };
