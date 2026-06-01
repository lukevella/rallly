import { defineConfig } from "i18next-cli";

export default defineConfig({
  locales: ["en"],
  extract: {
    input: ["src/**/*.{ts,tsx}"],
    output: "public/locales/{{language}}/{{namespace}}.json",
    defaultNS: "app",
    nsSeparator: false,
    keySeparator: false,
    defaultValue: "__STRING_NOT_TRANSLATED__",
    removeUnusedKeys: true,
    disablePlurals: true,
    functions: ["t"],
    transComponents: ["Trans"],
  },
});
